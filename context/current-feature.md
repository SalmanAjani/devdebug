# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

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
