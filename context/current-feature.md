# Current Feature: Forgot Password

## Status

In Progress

## Goals

- "Forgot password?" link on the sign-in form, next to the password field.
- `/forgot-password` page: email field, submits to a server action that emails a reset link.
- Response never varies with whether the address exists, has a password, or is
  rate-limited — same confirmation every time, no enumeration oracle.
- Reset tokens reuse the existing `VerificationToken` model, hashed and single-use,
  with a shorter TTL than email verification (1 hour).
- `/reset-password?token=...` page: new password + confirm, validated with Zod,
  hashed with bcrypt on submit.
- A successful reset clears any other live tokens for that address and lands on
  `/sign-in` with a success banner.
- Rate limit reset requests per address, same database-backed cooldown approach as
  the verification resend.
- Unit tests for the token helpers and the reset action.

## Notes

- Reuse, don't duplicate: `src/lib/verification.ts` already has hashing, issue,
  consume and cooldown helpers. Generalise them rather than copy-pasting a second set.
- **Identifier collision:** `verification_tokens` is keyed by `identifier` (the raw
  email) and `createVerificationToken` deletes every existing row for that identifier.
  Password reset tokens need a namespaced identifier (e.g. `reset:<email>`) or the two
  flows will silently invalidate each other's links.
- Email sending follows `src/lib/email.ts` — same inline-style template shape, same
  `AUTH_URL` origin helper, throw on Resend error.
- OAuth-only users have `password: null`. A reset request for one sends nothing but
  still returns the standard confirmation.
- Redemption is a mutation, so the reset submit is a server action; the
  `/reset-password` page only validates that a token was supplied and renders the form.
- Zod: add a reset schema in `src/lib/validations/auth.ts` reusing the existing
  `password` rules (8–72 chars, confirm must match).

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
- **Email Verification Toggle** - EMAIL_VERIFICATION_ENABLED flag behind isEmailVerificationEnabled() in src/lib/features.ts, defaults on and only "false" disables it, register stamps emailVerified and skips the send when off, authorize skips the unverified throw, resend action refuses, banner copy varies (Completed)
