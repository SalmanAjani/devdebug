import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * What a rate limit check tells the caller.
 *
 * `reset` is a Unix timestamp in milliseconds, matching what Upstash returns.
 */
export interface RateLimitResult {
  /** Whether the request may proceed. */
  success: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** When the window rolls over. */
  reset: number;
}

/** The auth surfaces we meter, and the budget each one gets. */
export const RATE_LIMITS = {
  signIn: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
} as const satisfies Record<string, { limit: number; window: `${number} ${"m" | "h"}` }>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Built once per action and reused across requests.
 *
 * Lazily, because constructing `Redis.fromEnv()` throws when the credentials
 * are missing — at module scope that would take down every route that merely
 * imports this file, which is the opposite of failing open.
 */
const limiters = new Map<RateLimitAction, Ratelimit>();

function getLimiter(action: RateLimitAction): Ratelimit {
  const existing = limiters.get(action);

  if (existing) return existing;

  const { limit, window } = RATE_LIMITS[action];

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    // Sliding window rather than fixed: a fixed window lets someone spend the
    // whole budget at 14:59 and the whole next budget at 15:01.
    limiter: Ratelimit.slidingWindow(limit, window),
    // Namespaced so the five actions never share a counter for one IP.
    prefix: `ratelimit:${action}`,
    // Upstash lets the request through if Redis has not answered in time. A
    // sign-in page that hangs on a slow Redis is a worse outage than one that
    // briefly stops counting.
    timeout: 2000,
  });

  limiters.set(action, limiter);

  return limiter;
}

/** Allowed, with no budget information — what every failure path returns. */
const ALLOW: RateLimitResult = { success: true, remaining: 1, reset: 0 };

/**
 * Whether rate limiting is wired up at all.
 *
 * Without credentials every check allows the request, so local development and
 * CI keep working untouched rather than being locked out by an unreachable
 * Redis.
 */
export function isRateLimitEnabled(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * The caller's IP address.
 *
 * `x-forwarded-for` is a comma-separated chain and the client is the first
 * entry. Vercel overwrites the header at the edge, so the value cannot be
 * spoofed there — behind a proxy that merely appends, it can be, which is why
 * this is a throttling key and never an authorization one.
 */
export async function getClientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");

  // "unknown" buckets every unidentifiable caller together. That is deliberate:
  // the alternative — a unique key per unknown — is no limit at all.
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * Consumes one token for `action` against `identifier`.
 *
 * Fails open. If Redis is down, misconfigured or unreachable, the request is
 * allowed: locking every user out of sign-in is a worse failure than briefly
 * not throttling anyone.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) return ALLOW;

  try {
    const { success, remaining, reset } = await getLimiter(action).limit(identifier);

    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check failed for ${action}:`, error);

    return ALLOW;
  }
}

/**
 * Rate limits `action` by the caller's IP, optionally narrowed by something
 * they supplied — an email address on the flows that have one.
 *
 * Adding the email tightens the limit rather than loosening it: the IP-keyed
 * budget still applies to everything else, so working through a list of
 * addresses from one IP cannot buy extra attempts. It is lowercased so casing
 * cannot split one address across buckets.
 */
export async function checkAuthRateLimit(
  action: RateLimitAction,
  email?: string
): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) return ALLOW;

  const ip = await getClientIp();
  const identifier = email ? `${ip}:${email.trim().toLowerCase()}` : ip;

  return checkRateLimit(action, identifier);
}

/** Whole minutes until `reset`, floored at 1 so the message never says "0 minutes". */
export function minutesUntilReset(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
}

/** Seconds until `reset`, for the `Retry-After` header. Floored at 1. */
export function secondsUntilReset(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

/** The user-facing throttle message, told in minutes. */
export function rateLimitMessage(reset: number): string {
  const minutes = minutesUntilReset(reset);

  return `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}
