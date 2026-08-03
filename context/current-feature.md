# Current Feature

<!-- Feature Name -->

Dashboard Recent Entries

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Add the Recently Viewed list back below the entry cards, sourced from the database. The entry grid already reads from Neon (previous feature), so the remaining work is the recently viewed section — the `RecentlyViewed` component still exists and only needs real data wired into it.

- Update `src/lib/db/entries.ts` with the data fetching functions
- Fetch entries directly in the server component
- Reference `context/screenshots/dashboard-ui-main.png` if needed, but the layout/design is already built

## Notes

<!-- Any extra notes -->

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
