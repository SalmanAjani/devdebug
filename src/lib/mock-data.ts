/**
 * Temporary mock data for the dashboard and entry drawer UI.
 * Replaced by Prisma queries once the database is wired up.
 */

// ============================================
// TYPES
// ============================================

export type EntryStatus = 'OPEN' | 'RESOLVED';

export type TechCategory =
  | 'FRONTEND'
  | 'BACKEND'
  | 'DATABASE'
  | 'DEVOPS'
  | 'AI'
  | 'OTHER';

export interface Technology {
  id: string;
  name: string;
  slug: string;
  category: TechCategory;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

export interface DebugEntry {
  id: string;
  title: string;
  description: string;
  errorMessage: string | null;
  rootCause: string;
  solution: string;
  status: EntryStatus;
  codeSnippet: string | null;
  codeLanguage: string | null;
  screenshotUrl: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  /** ISO date string, null if never opened */
  viewedAt: string | null;
  /** ISO date string */
  createdAt: string;
  technologies: Technology[];
  tags: string[];
  collectionIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  initials: string;
  isPro: boolean;
}

// ============================================
// CURRENT USER
// ============================================

export const MOCK_USER: User = {
  id: 'user_1',
  name: 'Dev Dana',
  email: 'dana@devdebug.io',
  image: null,
  initials: 'DD',
  isPro: true,
};

// ============================================
// TECHNOLOGIES
// ============================================

const TECH = {
  react: { id: 'tech_1', name: 'React', slug: 'react', category: 'FRONTEND' },
  nextjs: { id: 'tech_2', name: 'Next.js', slug: 'nextjs', category: 'FRONTEND' },
  typescript: {
    id: 'tech_3',
    name: 'TypeScript',
    slug: 'typescript',
    category: 'FRONTEND',
  },
  tailwind: {
    id: 'tech_4',
    name: 'Tailwind CSS',
    slug: 'tailwindcss',
    category: 'FRONTEND',
  },
  nodejs: { id: 'tech_5', name: 'Node.js', slug: 'nodejs', category: 'BACKEND' },
  express: { id: 'tech_6', name: 'Express', slug: 'express', category: 'BACKEND' },
  postgresql: {
    id: 'tech_7',
    name: 'PostgreSQL',
    slug: 'postgresql',
    category: 'DATABASE',
  },
  prisma: { id: 'tech_8', name: 'Prisma', slug: 'prisma', category: 'DATABASE' },
  redis: { id: 'tech_9', name: 'Redis', slug: 'redis', category: 'DATABASE' },
  docker: { id: 'tech_10', name: 'Docker', slug: 'docker', category: 'DEVOPS' },
  openai: { id: 'tech_11', name: 'OpenAI', slug: 'openai', category: 'AI' },
} as const satisfies Record<string, Technology>;

export const MOCK_TECHNOLOGIES: Technology[] = Object.values(TECH);

// ============================================
// COLLECTIONS
// ============================================

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col_1',
    name: 'React',
    description: 'Rendering, hydration and hook issues',
    isFavorite: true,
  },
  {
    id: 'col_2',
    name: 'Docker',
    description: 'Build, image and container problems',
    isFavorite: false,
  },
  {
    id: 'col_3',
    name: 'Database',
    description: 'Query performance and migration issues',
    isFavorite: false,
  },
  {
    id: 'col_4',
    name: 'Authentication',
    description: 'Sessions, tokens and OAuth',
    isFavorite: false,
  },
  {
    id: 'col_5',
    name: 'Production Issues',
    description: 'Bugs that only showed up in production',
    isFavorite: true,
  },
];

// ============================================
// DEBUG ENTRIES
// ============================================

export const MOCK_ENTRIES: DebugEntry[] = [
  {
    id: 'entry_1',
    title: 'Hydration mismatch on server-rendered date',
    description:
      'React threw a hydration warning because the server and client rendered different timestamps for the same component.',
    errorMessage:
      'Warning: Text content did not match. Server: "12:04 PM" Client: "12:04 PM"',
    rootCause:
      'Rendering `new Date()` directly in the component body produced a different value on the server than on the client during hydration.',
    solution:
      'Moved the time formatting into a useEffect so it only runs on the client, and rendered a stable placeholder during SSR.',
    status: 'RESOLVED',
    codeSnippet: `const [time, setTime] = useState<string | null>(null)
useEffect(() => {
  setTime(new Date().toLocaleTimeString())
}, [])
return <span>{time ?? "—"}</span>`,
    codeLanguage: 'tsx',
    screenshotUrl: null,
    isFavorite: true,
    isPinned: true,
    viewedAt: '2026-08-01T09:12:00.000Z',
    createdAt: '2026-07-14T10:00:00.000Z',
    technologies: [TECH.react, TECH.nextjs],
    tags: ['hydration', 'ssr'],
    collectionIds: ['col_1'],
  },
  {
    id: 'entry_2',
    title: 'CORS preflight failing on API route',
    description:
      'Browser blocked requests to the API with a CORS error even though the origin looked correct.',
    errorMessage:
      "Access to fetch at 'https://api.app.dev/v1/entries' from origin 'https://app.dev' has been blocked by CORS policy: Response to preflight request doesn't pass access control check.",
    rootCause:
      'The OPTIONS preflight request never reached the handler — the proxy in front of the container only forwarded GET and POST.',
    solution:
      'Allowed OPTIONS through the proxy and returned the Access-Control-Allow-* headers explicitly from the route handler.',
    status: 'RESOLVED',
    codeSnippet: `app.options('/v1/*', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://app.dev')
  res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.sendStatus(204)
})`,
    codeLanguage: 'ts',
    screenshotUrl: null,
    isFavorite: false,
    isPinned: true,
    viewedAt: '2026-07-31T16:40:00.000Z',
    createdAt: '2026-07-12T08:30:00.000Z',
    technologies: [TECH.docker, TECH.express, TECH.nodejs],
    tags: ['cors', 'preflight'],
    collectionIds: ['col_2', 'col_5'],
  },
  {
    id: 'entry_3',
    title: 'N+1 query slowing down the entries list',
    description:
      'The entries endpoint was making hundreds of database calls per request as the dataset grew.',
    errorMessage: null,
    rootCause:
      'Each entry lazily loaded its technologies and tags in a separate query instead of being fetched in one go.',
    solution:
      'Added an `include` for technologies and tags so Prisma batches the relations into a single round trip.',
    status: 'RESOLVED',
    codeSnippet: `const entries = await prisma.debugEntry.findMany({
  where: { userId },
  include: { technologies: true, tags: true },
  orderBy: { createdAt: 'desc' },
})`,
    codeLanguage: 'ts',
    screenshotUrl: null,
    isFavorite: true,
    isPinned: false,
    viewedAt: '2026-07-30T11:05:00.000Z',
    createdAt: '2026-07-10T14:20:00.000Z',
    technologies: [TECH.prisma, TECH.postgresql],
    tags: ['n+1', 'performance'],
    collectionIds: ['col_3'],
  },
  {
    id: 'entry_4',
    title: 'JWT expired on token refresh',
    description:
      'Users were being logged out randomly a few minutes after signing in.',
    errorMessage: 'JsonWebTokenError: jwt expired',
    rootCause:
      'The refresh handler compared the token expiry in seconds against a timestamp in milliseconds, so every token looked expired.',
    solution:
      'Still investigating — normalising both values to milliseconds fixes it locally but staging still logs users out.',
    status: 'OPEN',
    codeSnippet: `const isExpired = decoded.exp * 1000 < Date.now()`,
    codeLanguage: 'ts',
    screenshotUrl: null,
    isFavorite: false,
    isPinned: false,
    viewedAt: '2026-07-29T13:00:00.000Z',
    createdAt: '2026-07-08T09:45:00.000Z',
    technologies: [TECH.nodejs, TECH.typescript],
    tags: ['jwt', 'auth'],
    collectionIds: ['col_4'],
  },
  {
    id: 'entry_5',
    title: 'Docker build cache miss on every deploy',
    description:
      'CI rebuilt the entire image from scratch each run, making deploys painfully slow.',
    errorMessage: null,
    rootCause:
      'Copying the whole project before installing dependencies invalidates the layer cache on any file change.',
    solution:
      'Not fixed yet — testing a split COPY so package.json is copied and installed before the rest of the source.',
    status: 'OPEN',
    codeSnippet: `COPY package*.json ./
RUN npm ci
COPY . .`,
    codeLanguage: 'dockerfile',
    screenshotUrl: null,
    isFavorite: false,
    isPinned: false,
    viewedAt: '2026-07-28T17:25:00.000Z',
    createdAt: '2026-07-06T12:10:00.000Z',
    technologies: [TECH.docker],
    tags: ['docker', 'ci'],
    collectionIds: ['col_2'],
  },
  {
    id: 'entry_6',
    title: 'Tailwind classes purged in production',
    description:
      'Dynamically composed class names worked in dev but disappeared in the production build.',
    errorMessage: null,
    rootCause:
      'Tailwind scans source files as plain text, so class names built by string concatenation are never detected.',
    solution:
      'Replaced the concatenation with a lookup map containing the full class names so they appear literally in the source.',
    status: 'RESOLVED',
    codeSnippet: `const STATUS_CLASS = {
  OPEN: 'bg-status-open/10 text-status-open',
  RESOLVED: 'bg-status-resolved/10 text-status-resolved',
} as const`,
    codeLanguage: 'ts',
    screenshotUrl: null,
    isFavorite: false,
    isPinned: false,
    viewedAt: '2026-07-27T10:15:00.000Z',
    createdAt: '2026-07-04T15:50:00.000Z',
    technologies: [TECH.tailwind, TECH.react],
    tags: ['tailwind', 'build'],
    collectionIds: ['col_1', 'col_5'],
  },
  {
    id: 'entry_7',
    title: 'Redis connection pool exhausted under load',
    description:
      'Under traffic spikes the app started throwing connection timeout errors from Redis.',
    errorMessage:
      'Error: Connection pool timeout: all connections in use after 5000ms',
    rootCause:
      'A new Redis client was created per request in a route handler instead of reusing a single shared instance.',
    solution:
      'Moved the client into a module-level singleton cached on globalThis so hot reloads do not spawn new pools.',
    status: 'RESOLVED',
    codeSnippet: `const globalForRedis = globalThis as unknown as { redis?: Redis }
export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!)
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis`,
    codeLanguage: 'ts',
    screenshotUrl: null,
    isFavorite: false,
    isPinned: false,
    viewedAt: '2026-07-26T08:00:00.000Z',
    createdAt: '2026-07-02T11:30:00.000Z',
    technologies: [TECH.redis, TECH.nodejs],
    tags: ['redis', 'pool'],
    collectionIds: ['col_3', 'col_5'],
  },
  {
    id: 'entry_8',
    title: 'OpenAI structured output returning invalid JSON',
    description: 'The AI summary route intermittently failed to parse the model response.',
    errorMessage: 'SyntaxError: Unexpected token `\`` in JSON at position 0',
    rootCause:
      'The model wrapped its answer in a markdown code fence because the request used free-form text instead of a JSON schema.',
    solution:
      'In progress — switching the call to structured outputs with a Zod-derived JSON schema.',
    status: 'OPEN',
    codeSnippet: `const response = await openai.responses.parse({
  model: 'gpt-5-nano',
  input: prompt,
  text: { format: zodTextFormat(EntryDraftSchema, 'entry_draft') },
})`,
    codeLanguage: 'ts',
    screenshotUrl: null,
    isFavorite: true,
    isPinned: false,
    viewedAt: '2026-07-25T14:45:00.000Z',
    createdAt: '2026-06-30T16:05:00.000Z',
    technologies: [TECH.openai, TECH.typescript],
    tags: ['openai', 'json'],
    collectionIds: [],
  },
  {
    id: 'entry_9',
    title: 'Migration deadlock on concurrent deploys',
    description:
      'Two deploys running the same migration at once caused a database deadlock.',
    errorMessage: null,
    rootCause:
      'Both containers ran `prisma migrate deploy` on startup and competed for the same advisory lock on the migrations table.',
    solution:
      'Moved migrations into a dedicated release step that runs once before the new containers boot.',
    status: 'RESOLVED',
    codeSnippet: null,
    codeLanguage: null,
    screenshotUrl: null,
    isFavorite: false,
    isPinned: false,
    viewedAt: '2026-07-24T09:30:00.000Z',
    createdAt: '2026-06-28T10:40:00.000Z',
    technologies: [TECH.postgresql, TECH.prisma],
    tags: ['migration', 'deadlock'],
    collectionIds: ['col_3', 'col_5'],
  },
];
