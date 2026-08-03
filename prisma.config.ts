import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 removed `directUrl`. Neon's pooled endpoint can't hold the
// session-level advisory locks that migrations need, so the CLI uses the
// unpooled URL when one is configured. The runtime adapter in
// src/lib/prisma.ts still connects over the pooled DATABASE_URL.
//
// Deliberately not the `env()` helper from prisma/config: it throws at config
// load, which breaks `prisma generate` on a fresh clone or CI install step
// where no database is reachable yet. Commands that need a connection fail on
// their own with an invalid-URL error.
const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Prisma 7 no longer seeds automatically after `migrate dev` / `migrate reset`.
    // Run `npm run db:seed` explicitly.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl,
  },
});
