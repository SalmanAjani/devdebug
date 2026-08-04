/**
 * Deletes every user except the demo account, along with everything they own.
 *
 * Run with: npm run db:reset-users          (dry run — reports, changes nothing)
 *           npm run db:reset-users -- --yes (actually deletes)
 *
 * Written for the development branch, where accounts accumulate from testing
 * sign-up flows. `npm run db:seed` rebuilds the demo user's content afterwards.
 *
 * Deliberately dry-run by default: this is the one script in the repo that can
 * destroy real rows, and `DATABASE_URL` is the only thing deciding which
 * database that happens in.
 */
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

const DEMO_EMAIL = 'demo@devdebug.com';

const EXECUTE = process.argv.includes('--yes');

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
  console.log(EXECUTE ? 'mode: DELETE\n' : 'mode: dry run (pass --yes to delete)\n');

  const doomed = await prisma.user.findMany({
    where: { email: { not: DEMO_EMAIL } },
    select: {
      id: true,
      email: true,
      _count: {
        select: { entries: true, collections: true, aiUsage: true, accounts: true, sessions: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const demo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, _count: { select: { entries: true, collections: true } } },
  });

  // Not fatal — the script's job is removing the others — but deleting every
  // account including the one the seed rebuilds is worth saying out loud.
  if (!demo) {
    console.warn(`⚠ no demo user (${DEMO_EMAIL}) — nothing will be left behind\n`);
  } else {
    console.log(
      `keeping ${DEMO_EMAIL}` +
        ` — ${demo._count.entries} entries, ${demo._count.collections} collections\n`
    );
  }

  // No relation to User, so a cascade never reaches these. They are keyed by
  // email address, which is exactly what is about to stop existing.
  const staleTokens = await prisma.verificationToken.count({
    where: { identifier: { not: DEMO_EMAIL } },
  });

  if (doomed.length === 0 && staleTokens === 0) {
    console.log('Nothing to delete.');
    return;
  }

  console.log(`${doomed.length} user(s) to delete:`);
  for (const user of doomed) {
    const { entries, collections, aiUsage, accounts, sessions } = user._count;
    console.log(
      `    ${user.email.padEnd(28)} ${entries} entries · ${collections} collections` +
        ` · ${aiUsage} ai usage · ${accounts} accounts · ${sessions} sessions`
    );
  }
  console.log(`\n${staleTokens} stale verification token(s) to delete`);

  if (!EXECUTE) {
    console.log('\nDry run — nothing was deleted. Re-run with --yes to apply.');
    return;
  }

  // Everything the users own goes with them via `onDelete: Cascade`; the tokens
  // are the only rows that have to be named explicitly.
  const [tokens, users] = await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: { not: DEMO_EMAIL } } }),
    prisma.user.deleteMany({ where: { email: { not: DEMO_EMAIL } } }),
  ]);

  console.log(`\n✔ deleted ${users.count} user(s) and ${tokens.count} verification token(s)`);

  const [remainingUsers, remainingEntries, remainingCollections] = await Promise.all([
    prisma.user.count(),
    prisma.debugEntry.count(),
    prisma.collection.count(),
  ]);

  console.log(
    `✔ remaining: ${remainingUsers} user(s), ${remainingEntries} entrie(s),` +
      ` ${remainingCollections} collection(s)`
  );
}

main()
  .catch((error) => {
    console.error('\n✘ reset failed\n');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
