# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up the split auth config pattern for edge compatibility
  - `src/auth.config.ts` - edge-safe config (providers only, no adapter)
  - `src/auth.ts` - full config with Prisma adapter and JWT strategy
- Add the GitHub OAuth provider
- Add `src/app/api/auth/[...nextauth]/route.ts` exporting the handlers from `auth.ts`
- Protect `/dashboard/*` via Next.js 16 proxy at `src/proxy.ts`, redirecting unauthenticated users to sign-in
- Extend the Session type with `user.id` in `src/types/next-auth.d.ts`

## Notes

Spec: @context/features/auth-spec-files/auth-phase-1-spec.md

Use Context7 to verify the newest config and conventions before writing code.

Gotchas:

- Install `next-auth@beta` — `@latest` still resolves to v4
- Proxy file lives at `src/proxy.ts`, same level as `app/`
- Named export only: `export const proxy = auth(...)`, not a default export
- `session: { strategy: 'jwt' }` is required with the split config pattern
- Do not set a custom `pages.signIn` — this phase uses NextAuth's default page

Env vars needed: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`

Testing: hit `/dashboard` → redirects to sign-in → "Sign in with GitHub" → lands back on `/dashboard`.

References:

- Edge compatibility: https://authjs.dev/getting-started/installation#edge-compatibility
- Prisma adapter: https://authjs.dev/getting-started/adapters/prisma

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
