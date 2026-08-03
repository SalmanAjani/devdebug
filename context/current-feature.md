# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

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
