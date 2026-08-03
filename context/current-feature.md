# Current Feature

<!-- Feature Name -->

Sidebar Stats

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Show item counts next to the sidebar nav links — All Debug Entries, Collections, and Pinned — sourced from the database instead of `src/lib/mock-data.ts`.

- Counts render on the right side of each sidebar link, keeping the current design/layout
- Add `src/lib/db/collections.ts` for the collections count, following the pattern in `src/lib/db/entries.ts`
- Add the entry/pinned count queries to `src/lib/db/entries.ts`
- Fetch in the server component and pass down; scope on the demo user like the existing queries
- Spec: `context/features/stats-sidebar-spec.md`

## Notes

<!-- Any extra notes -->

Sidebar stats notes:

- Counts are three `prisma.count()` calls in the `(dashboard)` layout, fetched in parallel. Counting in Postgres avoids pulling rows the sidebar never renders.
- The layout is now async and reads the database, so it carries its own `export const dynamic = "force-dynamic"` — the page-level one does not cover the shell.
- `DEMO_USER_EMAIL` moved to `src/lib/db/user.ts` so `entries.ts` and `collections.ts` share one scope. That is still the single place to swap for the session user when NextAuth lands.
- `NavItem` gained a required `countKey`, so adding a nav link without a count is a type error. Widen it to optional if a countless link ever appears.
- Collapsed sidebar hides the number (no room) and puts it in the tooltip as `label · count`.
- `Sidebar` takes `counts` as a prop because it is a client component — the layout does the fetching and passes it down through both the desktop rail and the mobile drawer.
- The dashboard page still runs its own `getEntries()` for the grid. The sidebar count is a separate cheap query rather than threading the grid rows up through the layout, which React cannot do.

Dashboard entries notes:

- `getEntries()` scopes on `user: { email: DEMO_USER_EMAIL }` because auth has not shipped. Swap that `where` for the session `userId` once NextAuth lands — it is the only place that needs to change.
- The page needs `export const dynamic = "force-dynamic"`. Without it Next prerenders `/dashboard` as static and bakes the current rows into the build output.
- Pagination stays client-side (fetch all, slice in `EntriesSection`). Move it server-side via `searchParams` when the entry count justifies it.
- Recently Viewed runs as its own query (`getRecentlyViewedEntries`) rather than reusing the grid rows — it selects four columns and `take`s the limit in Postgres instead of pulling every entry back to filter and slice in JS.
- `viewedAt` is nullable in the schema, so the query filters `{ not: null }` and the result is narrowed with a type-predicate `filter` — a plain cast would have been a lie the moment the `where` changed.
- Nothing writes `viewedAt` yet. The list is real data, but it only moves when the seed sets it — the entry detail panel has to stamp `viewedAt` on open for it to become live.
- `mock-data.ts` survives only for `MOCK_USER` (sidebar). Delete it when auth lands.
- Tag chips render `tag.slug`, not `tag.name`, to keep the lowercase `#hydration` look from the mock UI.

Seed data notes:

- Demo login is `demo@devdebug.com` / `12345678` (bcryptjs, 12 rounds).
- Every record upserts on a stable key, so `npm run db:seed` is safe to re-run: user on `email`, technologies/tags on `slug`, collections on `[userId, name]`, AI usage on `[userId, period]`, entries on hardcoded `seed-entry-*` ids.
- Relation lists use `set` on update (replaces links) but `connect` on create — `set` is not valid in a Prisma `create` input.
- Entry/collection joins delete links no longer declared in the seed before upserting the current ones, otherwise removing a collection from an entry would never take effect.
- `src/lib/mock-data.ts` is now duplicated by the seed. Delete it once the dashboard reads from Prisma.

### Prisma 7 reference (carried over from the database setup)

- `prisma-client` generator (not `prisma-client-js`); `output` is mandatory. Import from `@/generated/prisma/client`, never `@prisma/client`.
- A driver adapter is required — `new PrismaClient({ adapter })`. `datasources` / `datasourceUrl` options are gone.
- No `url` in the `datasource` block; connection config lives in `prisma.config.ts`.
- `directUrl` was **removed** in v7. `prisma.config.ts` falls back to `DIRECT_URL` manually so migrations run over Neon's unpooled host while the app runs over the pooled one.
- Env vars no longer auto-load — `import 'dotenv/config'` in config and seed.
- Seeding no longer runs automatically after `migrate dev` / `migrate reset`. Run `npm run db:seed`.
- `$queryRaw` against catalog columns needs an explicit `::text` cast — the driver adapter cannot deserialize Postgres `name` columns.
- `src/generated` is gitignored; `postinstall` regenerates it. `prisma.config.ts` avoids the `env()` helper because it throws at config load and would break `npm install` on a fresh clone.

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
