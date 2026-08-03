/**
 * Development seed data.
 *
 * Run with: npm run db:seed
 *
 * Every record is upserted on a stable key, so re-running the seed updates the
 * existing rows instead of duplicating them. Debug entries have no natural
 * unique key, so they carry hardcoded ids.
 */
import 'dotenv/config';
import { hash } from 'bcryptjs';
import { EntryStatus, TechCategory } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

// ============================================
// USER
// ============================================

const DEMO_USER = {
  email: 'demo@devdebug.com',
  name: 'Demo User',
  password: '12345678',
  isPro: false,
};

const BCRYPT_ROUNDS = 12;

// ============================================
// TECHNOLOGIES
// ============================================

const technologies = [
  // Frontend
  { name: 'React', slug: 'react', category: TechCategory.FRONTEND },
  { name: 'Next.js', slug: 'nextjs', category: TechCategory.FRONTEND },
  { name: 'TypeScript', slug: 'typescript', category: TechCategory.FRONTEND },
  { name: 'Tailwind CSS', slug: 'tailwindcss', category: TechCategory.FRONTEND },
  // Backend
  { name: 'Node.js', slug: 'nodejs', category: TechCategory.BACKEND },
  { name: 'Spring Boot', slug: 'spring-boot', category: TechCategory.BACKEND },
  { name: 'Express', slug: 'express', category: TechCategory.BACKEND },
  { name: 'Python', slug: 'python', category: TechCategory.BACKEND },
  // Database
  { name: 'PostgreSQL', slug: 'postgresql', category: TechCategory.DATABASE },
  { name: 'Prisma', slug: 'prisma', category: TechCategory.DATABASE },
  { name: 'Redis', slug: 'redis', category: TechCategory.DATABASE },
  { name: 'MongoDB', slug: 'mongodb', category: TechCategory.DATABASE },
  // DevOps
  { name: 'Docker', slug: 'docker', category: TechCategory.DEVOPS },
  { name: 'Kubernetes', slug: 'kubernetes', category: TechCategory.DEVOPS },
  { name: 'GitHub Actions', slug: 'github-actions', category: TechCategory.DEVOPS },
  { name: 'Vercel', slug: 'vercel', category: TechCategory.DEVOPS },
  // AI
  { name: 'OpenAI', slug: 'openai', category: TechCategory.AI },
  { name: 'LangChain', slug: 'langchain', category: TechCategory.AI },
];

// ============================================
// TAGS
// ============================================

const tags = [
  { name: 'Hydration', slug: 'hydration' },
  { name: 'SSR', slug: 'ssr' },
  { name: 'CORS', slug: 'cors' },
  { name: 'Preflight', slug: 'preflight' },
  { name: 'N+1', slug: 'n-plus-1' },
  { name: 'Performance', slug: 'performance' },
  { name: 'JWT', slug: 'jwt' },
  { name: 'Auth', slug: 'auth' },
  { name: 'Docker', slug: 'docker' },
  { name: 'CI', slug: 'ci' },
  { name: 'Tailwind', slug: 'tailwind' },
  { name: 'Build', slug: 'build' },
  { name: 'Redis', slug: 'redis' },
  { name: 'Pool', slug: 'pool' },
  { name: 'OpenAI', slug: 'openai' },
  { name: 'JSON', slug: 'json' },
  { name: 'Migration', slug: 'migration' },
  { name: 'Deadlock', slug: 'deadlock' },
];

// ============================================
// COLLECTIONS
// ============================================

// Upserted on the [userId, name] unique constraint, so no id needed.
const collections = [
  { name: 'React', description: 'Rendering, hydration and hook issues' },
  { name: 'Docker', description: 'Build, image and container problems' },
  { name: 'Database', description: 'Query performance and migration issues' },
  { name: 'Authentication', description: 'Sessions, tokens and OAuth' },
  { name: 'Production Issues', description: 'Bugs that only showed up in production' },
];

// ============================================
// DEBUG ENTRIES
// ============================================

interface SeedEntry {
  /** Hardcoded so re-running the seed updates rather than duplicates. */
  id: string;
  title: string;
  description: string;
  errorMessage: string | null;
  rootCause: string;
  solution: string;
  status: EntryStatus;
  codeSnippet: string | null;
  codeLanguage: string | null;
  isPinned: boolean;
  viewedAt: string | null;
  createdAt: string;
  /** Technology slugs. */
  technologies: string[];
  /** Tag slugs. */
  tags: string[];
  /** Collection names. */
  collections: string[];
}

const entries: SeedEntry[] = [
  {
    id: 'seed-entry-hydration-mismatch',
    title: 'Hydration mismatch on server-rendered date',
    description:
      'React threw a hydration warning because the server and client rendered different timestamps for the same component.',
    errorMessage:
      'Warning: Text content did not match. Server: "12:04 PM" Client: "12:04 PM"',
    rootCause:
      'Rendering `new Date()` directly in the component body produced a different value on the server than on the client during hydration.',
    solution:
      'Moved the time formatting into a useEffect so it only runs on the client, and rendered a stable placeholder during SSR.',
    status: EntryStatus.RESOLVED,
    codeSnippet: `const [time, setTime] = useState<string | null>(null)
useEffect(() => {
  setTime(new Date().toLocaleTimeString())
}, [])
return <span>{time ?? "—"}</span>`,
    codeLanguage: 'tsx',
    isPinned: true,
    viewedAt: '2026-08-01T09:12:00.000Z',
    createdAt: '2026-07-14T10:00:00.000Z',
    technologies: ['react', 'nextjs'],
    tags: ['hydration', 'ssr'],
    collections: ['React'],
  },
  {
    id: 'seed-entry-cors-preflight',
    title: 'CORS preflight failing on API route',
    description:
      'Browser blocked requests to the API with a CORS error even though the origin looked correct.',
    errorMessage:
      "Access to fetch at 'https://api.app.dev/v1/entries' from origin 'https://app.dev' has been blocked by CORS policy: Response to preflight request doesn't pass access control check.",
    rootCause:
      'The OPTIONS preflight request never reached the handler — the proxy in front of the container only forwarded GET and POST.',
    solution:
      'Allowed OPTIONS through the proxy and returned the Access-Control-Allow-* headers explicitly from the route handler.',
    status: EntryStatus.RESOLVED,
    codeSnippet: `app.options('/v1/*', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://app.dev')
  res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.sendStatus(204)
})`,
    codeLanguage: 'ts',
    isPinned: true,
    viewedAt: '2026-07-31T16:40:00.000Z',
    createdAt: '2026-07-12T08:30:00.000Z',
    technologies: ['docker', 'express', 'nodejs'],
    tags: ['cors', 'preflight'],
    collections: ['Docker', 'Production Issues'],
  },
  {
    id: 'seed-entry-n-plus-1-query',
    title: 'N+1 query slowing down the entries list',
    description:
      'The entries endpoint was making hundreds of database calls per request as the dataset grew.',
    errorMessage: null,
    rootCause:
      'Each entry lazily loaded its technologies and tags in a separate query instead of being fetched in one go.',
    solution:
      'Added an `include` for technologies and tags so Prisma batches the relations into a single round trip.',
    status: EntryStatus.RESOLVED,
    codeSnippet: `const entries = await prisma.debugEntry.findMany({
  where: { userId },
  include: { technologies: true, tags: true },
  orderBy: { createdAt: 'desc' },
})`,
    codeLanguage: 'ts',
    isPinned: false,
    viewedAt: '2026-07-30T11:05:00.000Z',
    createdAt: '2026-07-10T14:20:00.000Z',
    technologies: ['prisma', 'postgresql'],
    tags: ['n-plus-1', 'performance'],
    collections: ['Database'],
  },
  {
    id: 'seed-entry-jwt-expired',
    title: 'JWT expired on token refresh',
    description: 'Users were being logged out randomly a few minutes after signing in.',
    errorMessage: 'JsonWebTokenError: jwt expired',
    rootCause:
      'The refresh handler compared the token expiry in seconds against a timestamp in milliseconds, so every token looked expired.',
    solution:
      'Still investigating — normalising both values to milliseconds fixes it locally but staging still logs users out.',
    status: EntryStatus.OPEN,
    codeSnippet: `const isExpired = decoded.exp * 1000 < Date.now()`,
    codeLanguage: 'ts',
    isPinned: false,
    viewedAt: '2026-07-29T13:00:00.000Z',
    createdAt: '2026-07-08T09:45:00.000Z',
    technologies: ['nodejs', 'typescript'],
    tags: ['jwt', 'auth'],
    collections: ['Authentication'],
  },
  {
    id: 'seed-entry-docker-cache-miss',
    title: 'Docker build cache miss on every deploy',
    description:
      'CI rebuilt the entire image from scratch each run, making deploys painfully slow.',
    errorMessage: null,
    rootCause:
      'Copying the whole project before installing dependencies invalidates the layer cache on any file change.',
    solution:
      'Not fixed yet — testing a split COPY so package.json is copied and installed before the rest of the source.',
    status: EntryStatus.OPEN,
    codeSnippet: `COPY package*.json ./
RUN npm ci
COPY . .`,
    codeLanguage: 'dockerfile',
    isPinned: false,
    viewedAt: '2026-07-28T17:25:00.000Z',
    createdAt: '2026-07-06T12:10:00.000Z',
    technologies: ['docker'],
    tags: ['docker', 'ci'],
    collections: ['Docker'],
  },
  {
    id: 'seed-entry-tailwind-purged',
    title: 'Tailwind classes purged in production',
    description:
      'Dynamically composed class names worked in dev but disappeared in the production build.',
    errorMessage: null,
    rootCause:
      'Tailwind scans source files as plain text, so class names built by string concatenation are never detected.',
    solution:
      'Replaced the concatenation with a lookup map containing the full class names so they appear literally in the source.',
    status: EntryStatus.RESOLVED,
    codeSnippet: `const STATUS_CLASS = {
  OPEN: 'bg-status-open/10 text-status-open',
  RESOLVED: 'bg-status-resolved/10 text-status-resolved',
} as const`,
    codeLanguage: 'ts',
    isPinned: false,
    viewedAt: '2026-07-27T10:15:00.000Z',
    createdAt: '2026-07-04T15:50:00.000Z',
    technologies: ['tailwindcss', 'react'],
    tags: ['tailwind', 'build'],
    collections: ['React', 'Production Issues'],
  },
  {
    id: 'seed-entry-redis-pool-exhausted',
    title: 'Redis connection pool exhausted under load',
    description:
      'Under traffic spikes the app started throwing connection timeout errors from Redis.',
    errorMessage: 'Error: Connection pool timeout: all connections in use after 5000ms',
    rootCause:
      'A new Redis client was created per request in a route handler instead of reusing a single shared instance.',
    solution:
      'Moved the client into a module-level singleton cached on globalThis so hot reloads do not spawn new pools.',
    status: EntryStatus.RESOLVED,
    codeSnippet: `const globalForRedis = globalThis as unknown as { redis?: Redis }
export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!)
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis`,
    codeLanguage: 'ts',
    isPinned: false,
    viewedAt: '2026-07-26T08:00:00.000Z',
    createdAt: '2026-07-02T11:30:00.000Z',
    technologies: ['redis', 'nodejs'],
    tags: ['redis', 'pool'],
    collections: ['Database', 'Production Issues'],
  },
  {
    id: 'seed-entry-openai-invalid-json',
    title: 'OpenAI structured output returning invalid JSON',
    description: 'The AI summary route intermittently failed to parse the model response.',
    errorMessage: 'SyntaxError: Unexpected token `\`` in JSON at position 0',
    rootCause:
      'The model wrapped its answer in a markdown code fence because the request used free-form text instead of a JSON schema.',
    solution:
      'In progress — switching the call to structured outputs with a Zod-derived JSON schema.',
    status: EntryStatus.OPEN,
    codeSnippet: `const response = await openai.responses.parse({
  model: 'gpt-5-nano',
  input: prompt,
  text: { format: zodTextFormat(EntryDraftSchema, 'entry_draft') },
})`,
    codeLanguage: 'ts',
    isPinned: false,
    viewedAt: '2026-07-25T14:45:00.000Z',
    createdAt: '2026-06-30T16:05:00.000Z',
    technologies: ['openai', 'typescript'],
    tags: ['openai', 'json'],
    collections: [],
  },
  {
    id: 'seed-entry-migration-deadlock',
    title: 'Migration deadlock on concurrent deploys',
    description: 'Two deploys running the same migration at once caused a database deadlock.',
    errorMessage: null,
    rootCause:
      'Both containers ran `prisma migrate deploy` on startup and competed for the same advisory lock on the migrations table.',
    solution:
      'Moved migrations into a dedicated release step that runs once before the new containers boot.',
    status: EntryStatus.RESOLVED,
    codeSnippet: null,
    codeLanguage: null,
    isPinned: false,
    viewedAt: '2026-07-24T09:30:00.000Z',
    createdAt: '2026-06-28T10:40:00.000Z',
    technologies: ['postgresql', 'prisma'],
    tags: ['migration', 'deadlock'],
    collections: ['Database', 'Production Issues'],
  },
];

// ============================================
// SEED
// ============================================

/** Current month as "YYYY-MM", the period key used by AiUsage. */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  // 1. User — everything else hangs off this record.
  const passwordHash = await hash(DEMO_USER.password, BCRYPT_ROUNDS);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      password: passwordHash,
      isPro: DEMO_USER.isPro,
    },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: passwordHash,
      isPro: DEMO_USER.isPro,
      emailVerified: new Date(),
    },
  });
  console.log(`✔ user           ${user.email}`);

  // 2. Technologies and tags — global lookup tables, keyed by slug.
  for (const tech of technologies) {
    await prisma.technology.upsert({
      where: { slug: tech.slug },
      update: { name: tech.name, category: tech.category },
      create: tech,
    });
  }
  console.log(`✔ technologies   ${technologies.length}`);

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
  }
  console.log(`✔ tags           ${tags.length}`);

  // 3. Collections — unique per [userId, name].
  const collectionIdByName = new Map<string, string>();
  for (const collection of collections) {
    const row = await prisma.collection.upsert({
      where: { userId_name: { userId: user.id, name: collection.name } },
      update: { description: collection.description },
      create: { ...collection, userId: user.id },
    });
    collectionIdByName.set(collection.name, row.id);
  }
  console.log(`✔ collections    ${collections.length}`);

  // 4. Entries — hardcoded ids keep this idempotent. `set` replaces the
  //    relation lists outright so re-running never stacks duplicate links.
  for (const entry of entries) {
    const scalars = {
      title: entry.title,
      description: entry.description,
      errorMessage: entry.errorMessage,
      rootCause: entry.rootCause,
      solution: entry.solution,
      status: entry.status,
      codeSnippet: entry.codeSnippet,
      codeLanguage: entry.codeLanguage,
      isPinned: entry.isPinned,
      viewedAt: entry.viewedAt ? new Date(entry.viewedAt) : null,
      createdAt: new Date(entry.createdAt),
    };
    const techRefs = entry.technologies.map((slug) => ({ slug }));
    const tagRefs = entry.tags.map((slug) => ({ slug }));

    await prisma.debugEntry.upsert({
      where: { id: entry.id },
      update: {
        ...scalars,
        technologies: { set: techRefs },
        tags: { set: tagRefs },
      },
      create: {
        id: entry.id,
        ...scalars,
        userId: user.id,
        technologies: { connect: techRefs },
        tags: { connect: tagRefs },
      },
    });
  }
  console.log(`✔ entries        ${entries.length}`);

  // 5. Entry/collection joins — composite primary key, so upsert is a no-op
  //    on re-run. Links the seed no longer declares are removed.
  let joinCount = 0;
  for (const entry of entries) {
    const collectionIds = entry.collections.map((name) => {
      const collectionId = collectionIdByName.get(name);
      if (!collectionId) throw new Error(`unknown collection "${name}"`);
      return collectionId;
    });

    await prisma.entryCollection.deleteMany({
      where: { entryId: entry.id, collectionId: { notIn: collectionIds } },
    });

    for (const collectionId of collectionIds) {
      await prisma.entryCollection.upsert({
        where: { entryId_collectionId: { entryId: entry.id, collectionId } },
        update: {},
        create: { entryId: entry.id, collectionId },
      });
      joinCount += 1;
    }
  }
  console.log(`✔ entry links    ${joinCount}`);

  // 6. AI usage for the current period so the free-tier meter has a row.
  const period = currentPeriod();
  await prisma.aiUsage.upsert({
    where: { userId_period: { userId: user.id, period } },
    update: { count: 7 },
    create: { userId: user.id, period, count: 7 },
  });
  console.log(`✔ ai usage       ${period}`);

  console.log('\nSeed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
