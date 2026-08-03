/**
 * Connectivity check for the Neon database.
 *
 * Run with: npm run db:test
 *
 * Read-only apart from one write that is rolled back, so it is safe to run
 * against any branch. Exits non-zero on the first failed check.
 */
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

function maskedHost(url: string | undefined): string {
  if (!url) return '<unset>';
  try {
    return new URL(url).host;
  } catch {
    return '<unparseable>';
  }
}

async function main() {
  console.log('DATABASE_URL host:', maskedHost(process.env.DATABASE_URL));
  console.log('DIRECT_URL host:  ', maskedHost(process.env.DIRECT_URL));

  // 1. Can we reach the database at all?
  // `current_database()` returns Postgres type `name`, which the driver adapter
  // cannot deserialize — cast to text.
  const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`
    SELECT current_database()::text AS db`;
  console.log(`\n✔ connected to "${db}"`);

  // 2. Has the schema been migrated?
  const migrations = await prisma.$queryRaw<{ name: string; applied: Date }[]>`
    SELECT migration_name AS name, finished_at AS applied
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at`;

  if (migrations.length === 0) {
    throw new Error('no applied migrations found — run `npm run db:migrate`');
  }
  console.log(`✔ ${migrations.length} migration(s) applied`);
  for (const m of migrations) {
    console.log(`    ${m.name}`);
  }

  // 3. Are the tables queryable through Prisma Client?
  const counts = {
    users: await prisma.user.count(),
    debugEntries: await prisma.debugEntry.count(),
    collections: await prisma.collection.count(),
    tags: await prisma.tag.count(),
    technologies: await prisma.technology.count(),
    aiUsage: await prisma.aiUsage.count(),
  };
  console.log('\n✔ row counts');
  for (const [model, count] of Object.entries(counts)) {
    console.log(`    ${model.padEnd(13)} ${count}`);
  }

  if (counts.technologies === 0) {
    console.warn('\n⚠ technologies table is empty — run `npm run db:seed`');
  }

  // 4. Do writes work? Rolled back so the database is left untouched.
  class Rollback extends Error {}
  try {
    await prisma.$transaction(async (tx) => {
      await tx.technology.create({
        data: { name: '__connectivity_check__', slug: '__connectivity_check__' },
      });
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  console.log('\n✔ write check passed (transaction rolled back)');

  console.log('\nDatabase is healthy.');
}

main()
  .catch((error) => {
    console.error('\n✘ database check failed\n');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
