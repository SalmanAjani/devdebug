# Auth Security Review

**Last audited:** 2026-08-06
**Scope:** NextAuth v5 config, credentials sign-in, email verification, password reset, profile & account mutations
**Files reviewed:** 33

## Summary

| Severity | Count |
| --- | :---: |
| Critical | 0 |
| High | 1 (fixed) |
| Medium | 0 |
| Low | 0 |

The token layer, password hashing, and the reset/verification/profile server actions are all clean and match the codebase's documented known-good state — nothing in that surface has regressed. One open-redirect gap was found in the sign-in page's own already-authenticated shortcut, which bypassed the `safeRedirect()` guard the rest of the app uses consistently. It was fixed the same day; no findings remain open.

## Findings

### [High] Open redirect on the sign-in page's already-authenticated shortcut — ✅ FIXED

> **Resolved 2026-08-06** in commit `e250e6b`. `safeRedirect()` moved to
> `src/lib/redirects.ts` and is now used by both the sign-in page and the server
> actions, with unit tests covering the `//` and `/\` bypass vectors. The
> description below is kept for the record.

**`src/app/(auth)/sign-in/page.tsx:74`**

**Issue:** When a user with a live session loads `/sign-in`, the page redirects them immediately using the raw `callbackUrl` query parameter, gated only by `callbackUrl?.startsWith("/")`. This is weaker than the `safeRedirect()` helper used everywhere else in the auth flow (`src/actions/auth.ts:41-47`), which additionally rejects values starting with `//` or `/\`. A value like `//evil.com` or `/\evil.com` passes `startsWith("/")` but is interpreted by browsers as a protocol-relative URL, i.e. an off-origin redirect.

```ts
// src/app/(auth)/sign-in/page.tsx:73-75
if (await auth()) {
  redirect(callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard");
}
```

**Exploit:** An attacker sends an already-authenticated DevDebug user a link such as `https://devdebug.example.com/sign-in?callbackUrl=//evil.com/phish`. The victim's browser has a valid session cookie, so `auth()` succeeds, and the server issues a redirect to `//evil.com/phish`, which the browser resolves to `https://evil.com/phish` — leaving the trusted origin without any further interaction. This is usable for phishing (e.g. a fake "session expired, sign in again" page) or for chaining into other off-site attacks that rely on originating from a link on the real domain. Note that the form-based sign-in path (`signInWithCredentials`/`signInWithGitHub`, both routed through `safeRedirect()`) is not affected — this is specific to the immediate-redirect branch that fires only for a visitor who already has a session.

**Fix:** Reuse the same rejection logic as `safeRedirect()` here (or import it) so both paths agree:

```ts
const isSafeCallback =
  callbackUrl?.startsWith("/") &&
  !callbackUrl.startsWith("//") &&
  !callbackUrl.startsWith("/\\");

if (await auth()) {
  redirect(isSafeCallback ? callbackUrl : "/dashboard");
}
```

---

## Passed Checks

| Area | Check | Status |
| --- | --- | :---: |
| Password hashing | bcrypt cost 12, single shared `SALT_ROUNDS` constant, one `hashPassword()` used by register/reset/change (`src/lib/password.ts`) | ✅ |
| Password hashing | Hash never returned from `authorize()` into the JWT — only `id`/`email`/`name`/`image` (`src/auth.ts:70`) | ✅ |
| Credentials sign-in | Password compared before the email-verification check, so verification state can't be probed without a correct password (`src/auth.ts:57-67`) | ✅ |
| Credentials sign-in | Missing user and null-password (OAuth-only) accounts both return `null` rather than throwing or distinguishing (`src/auth.ts:57`) | ✅ |
| Token generation | `randomBytes(32).toString("base64url")` — 256 bits of CSPRNG output, never `Math.random()` or a UUID (`src/lib/tokens.ts:68`) | ✅ |
| Token storage | Only `sha256(token)` stored, raw token never persisted (`src/lib/tokens.ts:49-51`) | ✅ |
| Token redemption | `consumeToken()` deletes via `deleteMany` and treats `count === 0` as failure — a racing second request loses (`src/lib/tokens.ts:117-119`) | ✅ |
| Token redemption | Expiry checked after the delete, so a value read as "consumed" is always actually gone (`src/lib/tokens.ts:121-123`) | ✅ |
| Token scoping | Verification and reset tokens share a table but are disambiguated by a `password-reset:` identifier prefix; presenting one flow's token to the other is refused and leaves the original row intact (`src/lib/tokens.ts:113`, verified by `src/lib/tokens.test.ts:119-142`) | ✅ |
| Token scoping | Zod's `z.email()` rejects the quoted local parts that could smuggle a colon into an identifier | ✅ |
| Rate limiting | Resend-verification and password-reset cooldowns are enforced in the database via `isWithinCooldown`, not an in-memory counter — durable across serverless cold starts (`src/lib/tokens.ts:143-160`) | ✅ |
| Email enumeration | `resendVerificationEmail` and `requestPasswordReset` return an identical response for unknown address, already-verified, OAuth-only, and throttled cases (`src/actions/auth.ts:160-162`, `src/actions/password-reset.ts:61-63`) | ✅ |
| Email enumeration | Sign-in returns the same "Invalid email or password" message for a nonexistent user and a wrong password (`src/actions/auth.ts:92-94`) | ✅ |
| Password reset | TTL is 1h vs. 24h for verification — materially shorter for the higher-stakes flow (`src/lib/password-reset.ts:18`) | ✅ |
| Password reset | `resetUserPassword` writes the password, stamps `emailVerified`, and drops the pending verification token in a single `$transaction`, with `count > 0` handling the account vanishing mid-submit (`src/lib/password-reset.ts:78-97`) | ✅ |
| Password reset | Issuing a new token deletes the previous one for that scope+address first (`src/lib/tokens.ts:70-79`) | ✅ |
| Password reset | Failed email send revokes the just-issued token so the cooldown doesn't strand the user (`src/actions/password-reset.ts:67-74`, verified by `password-reset.test.ts:148-155`) | ✅ |
| Input validation | Every Server Action (`auth.ts`, `password-reset.ts`, `profile.ts`) and the register route parse `FormData`/JSON with Zod before use — none rely on client-side checks alone | ✅ |
| Secrets | `AUTH_SECRET`, `RESEND_API_KEY` read only via `process.env` server-side, never `NEXT_PUBLIC_*`; `src/lib/features.ts` explicitly documents why flags stay server-only | ✅ |
| Open redirect | `safeRedirect()` in `src/lib/redirects.ts` rejects non-`/`, `//`, and `/\` prefixes, and is now the single shared guard for the sign-in/OAuth form submissions *and* the sign-in page's already-authenticated shortcut (`src/lib/redirects.test.ts`) | ✅ |
| Open redirect | Proxy's `callbackUrl` is built server-side from `pathname + search` only, never from user input directly (`src/proxy.ts:16-19`) | ✅ |
| Profile mutations | `changePassword` and `deleteAccount` resolve the user via `requireUserId()` from the session, never a form field (`src/actions/profile.ts:47,94`) | ✅ |
| Profile mutations | Changing a password requires `compare()` against the current password hash before any write (`src/actions/profile.ts:62`) | ✅ |
| Profile mutations | OAuth-only accounts refused server-side in `changePassword` even though the UI already hides the option (`src/actions/profile.ts:58-60`) | ✅ |
| Account deletion | Scoped to the session's `userId`; cascades cover entries/collections/accounts/sessions, and `deleteUserAccount` additionally clears both email-keyed verification/reset token rows so an abandoned link can't apply to a future registrant of the same address (`src/lib/db/user.ts:42-56`) | ✅ |
| Data exposure | `getProfile()` selects the `password` column only to compute a `hasPassword` boolean — the hash itself never leaves the function (`src/lib/db/user.ts:92-123`) | ✅ |
| Email content | User-supplied `name` is HTML-escaped before interpolation into the verification/reset email templates (`src/lib/email.ts:35-41`) | ✅ |
| Schema | `VerificationToken.token` is `@unique`, cascading deletes configured on `Account`/`Session` so a deleted user doesn't strand OAuth or session rows | ✅ |
| Tests | `password-reset.test.ts` and `profile.test.ts` assertions align with all of the above — no test contradicts a reviewed behaviour | ✅ |

## Not Implemented

These are absent from the codebase and are not findings — noted for context only:

- **Account lockout / brute-force throttling on credentials sign-in.** Repeated wrong-password attempts against a known email are not rate-limited beyond whatever NextAuth/infrastructure provides. Worth considering before a public launch, but out of scope for a roadmap-stage app.
- **Session revocation after password change.** Sessions are JWTs with no server-side row, so an existing session survives a password change or account compromise recovery until it expires naturally. Documented as an accepted limitation in the code (`src/lib/password-reset.ts:76`, `src/lib/account.ts:14`).
- **2FA, CAPTCHA, audit logging.** None present; not evaluated as findings per the audit scope.
