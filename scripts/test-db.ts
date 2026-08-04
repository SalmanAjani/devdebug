/**
 * Connectivity and seed-data check for the Neon database.
 *
 * Run with: npm run db:test
 *
 * Read-only apart from one write that is rolled back, so it is safe to run
 * against any branch. Exits non-zero on the first failed check.
 */
import 'dotenv/config';
import { EntryStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const DEMO_EMAIL = 'demo@devdebug.com';

function maskedHost(url: string | undefined): string {
  if (!url) return '<unset>';
  try {
    return new URL(url).host;
  } catch {
    return '<unparseable>';
  }
}

function statusLabel(status: EntryStatus): string {
  return status === EntryStatus.RESOLVED ? '● resolved' : '○ open    ';
}

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '—';
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
  const [users, debugEntries, collections, entryLinks, tags, technologies, aiUsage] =
    await Promise.all([
      prisma.user.count(),
      prisma.debugEntry.count(),
      prisma.collection.count(),
      prisma.entryCollection.count(),
      prisma.tag.count(),
      prisma.technology.count(),
      prisma.aiUsage.count(),
    ]);

  const counts = {
    users,
    debugEntries,
    collections,
    entryLinks,
    tags,
    technologies,
    aiUsage,
  };
  console.log('\n✔ row counts');
  for (const [model, count] of Object.entries(counts)) {
    console.log(`    ${model.padEnd(13)} ${count}`);
  }

  // 4. Is the seed data present and are the relations wired up?
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      collections: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { entries: true } } },
      },
      aiUsage: { orderBy: { period: 'desc' } },
      _count: { select: { entries: true } },
    },
  });

  if (!user) {
    console.warn(`\n⚠ no demo user (${DEMO_EMAIL}) — run \`npm run db:seed\``);
  } else {
    console.log('\n✔ demo user');
    console.log(`    ${user.name} <${user.email}>`);
    console.log(
      `    plan: ${user.isPro ? 'Pro' : 'Free'}` +
        ` · password: ${user.password ? 'set' : 'none'}` +
        ` · verified: ${user.emailVerified ? 'yes' : 'no'}` +
        ` · entries: ${user._count.entries}`
    );

    console.log(`\n✔ collections (${user.collections.length})`);
    for (const c of user.collections) {
      console.log(
        `    ${c.name.padEnd(18)} ${String(c._count.entries).padStart(2)} entries` +
          `  ${c.description ?? ''}`
      );
    }

    const entries = await prisma.debugEntry.findMany({
      where: { userId: user.id },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        technologies: { orderBy: { name: 'asc' } },
        tags: { orderBy: { name: 'asc' } },
        collections: { include: { collection: true } },
      },
    });

    const open = entries.filter((e) => e.status === EntryStatus.OPEN).length;
    const resolved = entries.length - open;
    const pinned = entries.filter((e) => e.isPinned).length;

    console.log(
      `\n✔ debug entries (${entries.length}) — ${open} open, ${resolved} resolved, ${pinned} pinned`
    );
    for (const e of entries) {
      const pin = e.isPinned ? '📌' : '  ';
      console.log(`    ${pin} ${statusLabel(e.status)}  ${e.title}`);
      console.log(
        `          tech: ${e.technologies.map((t) => t.name).join(', ') || '—'}` +
          ` · tags: ${e.tags.map((t) => t.name).join(', ') || '—'}`
      );
      console.log(
        `          collections: ${e.collections.map((c) => c.collection.name).join(', ') || '—'}` +
          ` · created: ${formatDate(e.createdAt)}` +
          ` · code: ${e.codeLanguage ?? '—'}`
      );
    }

    // Mirrors the dashboard's "Recently viewed" list.
    const recent = await prisma.debugEntry.findMany({
      where: { userId: user.id, viewedAt: { not: null } },
      orderBy: { viewedAt: 'desc' },
      take: 3,
      select: { title: true, viewedAt: true, status: true },
    });
    console.log('\n✔ recently viewed');
    for (const e of recent) {
      console.log(`    ${formatDate(e.viewedAt)}  ${statusLabel(e.status)}  ${e.title}`);
    }

    console.log('\n✔ ai usage');
    if (user.aiUsage.length === 0) {
      console.log('    (none)');
    }
    for (const usage of user.aiUsage) {
      console.log(`    ${usage.period}  ${usage.count} / 20 free summaries used`);
    }

    // Integrity — catches half-applied seeds and broken relation wiring.
    const problems: string[] = [];
    const orphaned = await prisma.debugEntry.count({ where: { userId: { not: user.id } } });
    if (orphaned > 0) problems.push(`${orphaned} entrie(s) not owned by the demo user`);

    for (const e of entries) {
      if (e.technologies.length === 0) problems.push(`"${e.title}" has no technologies`);
      if (e.tags.length === 0) problems.push(`"${e.title}" has no tags`);
    }

    const linkTotal = entries.reduce((n, e) => n + e.collections.length, 0);
    if (linkTotal !== counts.entryLinks) {
      problems.push(
        `entry/collection links mismatch: ${linkTotal} via relations vs ${counts.entryLinks} rows`
      );
    }

    if (problems.length > 0) {
      throw new Error(`seed data integrity problems:\n  - ${problems.join('\n  - ')}`);
    }
    console.log('\n✔ integrity checks passed');
  }

  // 5. Do writes work? Rolled back so the database is left untouched.
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
