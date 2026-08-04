# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

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
- **Forgot Password** - Shared token layer in src/lib/tokens.ts scoping verification_tokens by purpose, reset identifiers prefixed password-reset:, /forgot-password and /reset-password pages, 1h TTL with 60s cooldown, uniform response, reset stamps emailVerified and drops the pending verification token, hashPassword extracted, Vitest set up with 35 tests (Completed)
