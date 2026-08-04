# Current Feature: Email Verification Toggle

## Status

In Progress

## Goals

- Add a single server-side flag that turns the whole email verification flow on or off.
- Read it from an env var (`EMAIL_VERIFICATION_ENABLED`) through one typed helper in
  `src/lib/features.ts`, so no other file touches `process.env` for this.
- Default to **enabled**: only the literal `"false"` disables it. A missing or typo'd
  value must not silently drop verification in production.
- With the flag **off**:
  - `POST /api/auth/register` creates the user with `emailVerified` already stamped,
    skips `createVerificationToken` and `sendVerificationEmail`, and never needs a
    `RESEND_API_KEY`.
  - Credentials `authorize` in `src/auth.ts` skips the `EmailUnverifiedError` throw.
  - `resendVerificationEmail` in `src/actions/auth.ts` returns without sending, and the
    resend button never renders.
  - The post-register banner on `/sign-in` says the account is ready to sign in, not
    "check your inbox".
- With the flag **on**, behaviour is byte-for-byte what it is today.
- `GET /api/auth/verify-email` keeps working regardless of the flag, so links already in
  someone's inbox still redeem.
- Document the variable in `.env.example` with a note on why it exists.
- `npm run build` and `npm run lint` clean; both flag states verified in the browser.

## Notes

**Why:** Resend has no verified domain on this project yet, so `onboarding@resend.dev`
only delivers to the account owner's address. Any other signup gets an account it can
never sign into. The flag makes local and pre-launch testing possible without gutting the
verification code.

**Touchpoints identified:**

| File | Change |
| --- | --- |
| `src/lib/features.ts` | New. `isEmailVerificationEnabled()` |
| `src/app/api/auth/register/route.ts` | Skip token + email, stamp `emailVerified` |
| `src/auth.ts` | Skip the unverified throw in `authorize` |
| `src/actions/auth.ts` | Short-circuit `resendVerificationEmail` |
| `src/components/auth/SignInForm.tsx` | ~~Hide the resend button when off~~ — no change needed |
| `src/app/(auth)/sign-in/page.tsx` | `?registered=1` banner copy varies by flag |
| `.env.example` | Document `EMAIL_VERIFICATION_ENABLED` |

`SignInForm` turned out to need nothing: it renders the resend button off
`state.unverifiedEmail`, which is only ever set by the `EmailUnverifiedError` that
`authorize` no longer throws when the flag is off. No prop to drill.

**Decisions to confirm during implementation:**

- Stamping `emailVerified` at creation while the flag is off means those accounts keep
  working if the flag is later switched on. The alternative — leaving it `null` — locks
  every account created during the off period out at flip time. Going with the stamp.
- The helper is server-only. It must not leak into a client component via
  `NEXT_PUBLIC_`; anything the UI needs is passed down from a server component as a prop.

## History

- **Initial Setup** - Next.js 16, Tailwind CSS v4, TypeScript configured (Completed)
- **Dashboard UI Phase 1** - Shadcn/ui init, /dashboard route, layout shell, dark mode, top bar with search and new entry/collection buttons (Completed)
- **Dashboard UI Phase 2** - Collapsible sidebar with brand header, nav links, user avatar footer, mobile drawer (Completed)
- **Dashboard UI Phase 3** - Main content area with entry header and counts, filter/view toolbar, paginated card grid, status and tech badges, recently viewed list (Completed)
- **Remove Favorites** - Dropped favorites in favour of pinned (Completed)
- **Database Setup** - Prisma 7 with Neon PostgreSQL, full schema and init migration, technology seed, Neon driver adapter, db npm scripts (Completed)
- **Seed Mock Data** - Idempotent seed across every model: demo user, technologies, tags, collections, entries, AI usage (Completed)
- **Dashboard Entries Real Data** - Entry grid reads Neon through src/lib/db/entries.ts, async server component, components typed off Prisma (Completed)
- **Dashboard Recent Entries** - Recently viewed list from its own query, fetched in parallel with the grid (Completed)
- **Sidebar Stats** - Entry, pinned and collection counts from Neon, fetched in parallel in the dashboard layout, shown in tooltip when collapsed (Completed)
- **Remove Mock Data** - Deleted mock-data.ts, sidebar user read from the database, empty state for the entries grid (Completed)
- **Code Scan Quick Wins** - Composite entry list index migration, trimmed entries select, loading skeleton, dashboard and global error boundaries sharing an ErrorState component (Completed)
- **Auth Setup Phase 1** - NextAuth v5 with GitHub OAuth, split auth config for edge compatibility, Prisma adapter with JWT strategy, /dashboard route protection via proxy, Session type with user.id (Completed)
- **Auth Setup Phase 2** - Credentials provider with email/password, bcrypt validation, /api/auth/register endpoint with Zod validation (Completed)
- **Auth Setup Phase 3** - Custom sign-in and register pages, reusable UserAvatar component with image/initials fallback, sidebar user dropdown with profile link and sign out, dashboard queries scoped to the authenticated session user (Completed)
- **Email Verification on Register** - Resend verification link on signup, hashed single-use tokens with 24h expiry, /api/auth/verify-email redemption route, credentials sign-in blocked until verified, rate-limited resend button, single-banner sign-in page, db:reset-users script (Completed)
