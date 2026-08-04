# Current Feature: Email Verification on Register

## Status

In Progress

## Goals

- Send a verification email through Resend when an account is created via `/api/auth/register`.
- Email contains a link the user clicks to verify. Clicking it marks the account verified and lands the user on the sign-in page with a success banner.
- Block credentials sign-in until the account is verified, with a clear message instead of the generic "Invalid email or password."
- Let an unverified user request a fresh link (resend), rate limited so the endpoint cannot be used to spam an inbox.
- Handle the failure cases explicitly: token missing, malformed, expired, or already used.

## Notes

**Existing pieces to build on**

- `VerificationToken` model already exists in the schema (`identifier` / `token` / `expires`, unique on both) — reuse it rather than adding a table. No migration needed unless we decide otherwise.
- `User.emailVerified` already exists and is currently never written. GitHub OAuth users get it set by the Prisma adapter; credentials users are the gap.
- Registration flow today: [RegisterForm.tsx](src/components/auth/RegisterForm.tsx) → `POST` [route.ts](src/app/api/auth/register/route.ts) → redirect to `/sign-in?registered=1`. The banner copy on that redirect needs to change to "check your email".
- Credentials gate lives in `authorize()` in [auth.ts:32-54](src/auth.ts#L32-L54).

**Decisions to make during implementation**

- Store a hash of the token (not the raw value) so a database leak does not hand out working links. Raw token goes in the email only.
- Token expiry: 24 hours. Delete the row on use so a link is single-use.
- Verification link needs an absolute base URL — check whether `AUTH_URL` is set in `.env`, add it if not.
- Resend is not installed yet (`npm i resend`). From address is `onboarding@resend.dev`; `RESEND_API_KEY` is already in `.env`.
- Resend's shared `onboarding@resend.dev` sender only delivers to the Resend account owner's address in test mode — verify with salmanajani98@gmail.com.
- Email sending must not fail registration: if Resend errors, the account is still created and the user can resend.
- Do not leak whether an email is registered from the resend endpoint — same response either way.
- `npm run test` is in CLAUDE.md but there is no `test` script or Vitest in `package.json`; if unit tests are wanted for the token helpers, that setup has to happen first.

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
