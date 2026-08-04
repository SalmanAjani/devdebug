# Current Feature: Auth Setup Phase 2 - Credentials Provider

## Status

In Progress

## Goals

- Add a Credentials provider for email/password sign-in alongside the existing GitHub OAuth
- Hash and verify passwords with bcryptjs
- Add `POST /api/auth/register` accepting name, email, password, confirmPassword
- Registration validates passwords match, rejects an email that already exists, hashes the password, creates the user, and returns a success/error response
- Email/password sign-in through `/api/auth/signin` lands on `/dashboard`
- GitHub OAuth keeps working unchanged

## Notes

- Split config pattern: `auth.config.ts` declares the Credentials provider with an `authorize: () => null` placeholder (keeps it edge-safe); `auth.ts` overrides it with the real bcrypt validation.
- `User.password` (`String?`, null for OAuth-only users) already exists in the schema — no migration needed.
- bcryptjs is already installed (seed.ts uses it).
- Testing: register via curl, then sign in at `/api/auth/signin`, verify redirect to `/dashboard`, then re-verify GitHub OAuth.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123","confirmPassword":"password123"}'
```

- Reference: https://authjs.dev/getting-started/authentication/credentials

## History

- Initial Setup - Next.js 16, Tailwind CSS v4, TypeScript configured (Completed)
- Dashboard UI Phase 1 - shadcn/ui init, /dashboard route, layout shell, dark mode, top bar with search and new entry/collection buttons (Completed)
- Dashboard UI Phase 2 - collapsible sidebar with brand header, nav links (All Debug Entries, Collections, Pinned, Favorites), user avatar footer with settings, collapse toggle, mobile drawer (Completed)
- Dashboard UI Phase 3 - main content area with entry header/counts, filter and view toolbar, paginated entry card grid (6 per page), status/tech/tag badges, recently viewed list (Completed)
- Remove Favorites - dropped favorites in favour of pinned: removed sidebar nav link and entry card star icon (no /favorites route existed) (Completed)
- Database Setup - Prisma 7 + Neon PostgreSQL: schema for all 10 models, init migration, technology seed, Neon driver adapter, prisma.config.ts, db npm scripts, scripts/test-db.ts connectivity check (Completed)
- Seed Mock Data - rewrote prisma/seed.ts to cover every model: demo user with bcryptjs hash, 18 technologies, 18 tags, 5 collections, 9 entries with hardcoded ids, 12 entry/collection links, AI usage row; fully idempotent; scripts/test-db.ts expanded to print the seeded data and run integrity checks (Completed)
- Dashboard Entries Real Data - dashboard grid reads Neon via new src/lib/db/entries.ts, async server component with force-dynamic, entry components typed off Prisma instead of mock-data, recently viewed deferred (Completed)
- Dashboard Recent Entries - recently viewed list back below the cards, own getRecentlyViewedEntries query (top 5 by viewedAt desc, nulls excluded), fetched in parallel with the grid, RecentlyViewed typed off Prisma (Completed)
- Sidebar Stats - item counts beside the sidebar links from Neon: new src/lib/db/collections.ts, entry/pinned counts in entries.ts, shared DEMO_USER_EMAIL in src/lib/db/user.ts, counts fetched in parallel in the async dashboard layout, count in tooltip when collapsed (Completed)
- Remove Mock Data - deleted src/lib/mock-data.ts, sidebar footer now reads the demo user via getCurrentUser() in src/lib/db/user.ts, null-safe on an unseeded database, empty state for the entries grid (Completed)
- Code Scan Quick Wins - low-risk fixes from the code scan: entry_list_indexes migration (composite userId/isPinned/createdAt, dropped two redundant indexes), trimmed unused columns from the entries select, blank-name avatar fallback in getCurrentUser, parallel counts in scripts/test-db.ts, dashboard loading skeleton, (dashboard)/error.tsx plus global-error.tsx sharing a new ErrorState component; root error.tsx cannot catch a layout throw, so global-error is what covers the sidebar-count query; prod branch still needs prisma migrate deploy (Completed)
- Auth Setup Phase 1 - NextAuth v5 + GitHub OAuth: split config (auth.config.ts edge-safe, auth.ts with Prisma adapter and JWT strategy), jwt/session callbacks carrying user.id, redirect callback sending post-login to /dashboard, [...nextauth] route handler, src/proxy.ts protecting /dashboard/* via NextAuth's default sign-in page, Session type augmentation; augment @auth/core/jwt not next-auth/jwt (re-export blocks declaration merging); sign-out will need an explicit redirectTo since the redirect callback cannot tell it from sign-in; getCurrentUser still reads DEMO_USER_EMAIL (Completed)
