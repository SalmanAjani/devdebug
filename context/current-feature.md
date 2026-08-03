# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

Prisma 7 gotchas worth remembering for future schema work:

- `prisma-client` generator (not `prisma-client-js`); `output` is mandatory. Import from `@/generated/prisma/client`, never `@prisma/client`.
- A driver adapter is required — `new PrismaClient({ adapter })`. `datasources` / `datasourceUrl` options are gone.
- No `url` in the `datasource` block; connection config lives in `prisma.config.ts`.
- `directUrl` was **removed** in v7. `prisma.config.ts` falls back to `DIRECT_URL` manually so migrations run over Neon's unpooled host while the app runs over the pooled one.
- Env vars no longer auto-load — `import 'dotenv/config'` in config and seed.
- Seeding no longer runs automatically after `migrate dev` / `migrate reset`. Run `npm run db:seed`.
- Client middleware removed (use Client Extensions); `--skip-generate` / `--skip-seed` / `--schema` / `--url` CLI flags removed.
- `src/generated` is gitignored; `postinstall` regenerates it. `prisma.config.ts` avoids the `env()` helper because it throws at config load and would break `npm install` on a fresh clone.

## History

- Initial Setup - Next.js 16, Tailwind CSS v4, TypeScript configured (Completed)
- Dashboard UI Phase 1 - shadcn/ui init, /dashboard route, layout shell, dark mode, top bar with search and new entry/collection buttons (Completed)
- Dashboard UI Phase 2 - collapsible sidebar with brand header, nav links (All Debug Entries, Collections, Pinned, Favorites), user avatar footer with settings, collapse toggle, mobile drawer (Completed)
- Dashboard UI Phase 3 - main content area with entry header/counts, filter and view toolbar, paginated entry card grid (6 per page), status/tech/tag badges, recently viewed list (Completed)
- Remove Favorites - dropped favorites in favour of pinned: removed sidebar nav link and entry card star icon (no /favorites route existed) (Completed)
- Database Setup - Prisma 7 + Neon PostgreSQL: schema for all 10 models, init migration, technology seed, Neon driver adapter, prisma.config.ts, db npm scripts, scripts/test-db.ts connectivity check (Completed)
