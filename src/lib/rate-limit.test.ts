import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn();
const headersGet = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    limit = limit;
    static slidingWindow = vi.fn(() => "sliding-window");
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: headersGet }),
}));

// Imported after the mocks so the module picks them up. Re-imported per test
// via `resetModules` below, because the limiter cache is module state.
async function importModule() {
  return import("@/lib/rate-limit");
}

/** Turns rate limiting on by giving the module the credentials it looks for. */
function enable() {
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
}

function disable() {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  headersGet.mockReturnValue("203.0.113.7");
  limit.mockResolvedValue({ success: true, remaining: 4, reset: 0 });
  enable();
});

afterEach(() => {
  disable();
  vi.useRealTimers();
});

describe("isRateLimitEnabled", () => {
  it("is on when both credentials are present", async () => {
    const { isRateLimitEnabled } = await importModule();

    expect(isRateLimitEnabled()).toBe(true);
  });

  it.each(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"])(
    "is off when %s is missing",
    async (missing) => {
      delete process.env[missing];

      const { isRateLimitEnabled } = await importModule();

      expect(isRateLimitEnabled()).toBe(false);
    }
  );
});

describe("checkRateLimit", () => {
  it("passes the identifier through and reports the budget", async () => {
    limit.mockResolvedValue({ success: false, remaining: 0, reset: 1_000 });

    const { checkRateLimit } = await importModule();

    await expect(checkRateLimit("signIn", "id")).resolves.toEqual({
      success: false,
      remaining: 0,
      reset: 1_000,
    });
    expect(limit).toHaveBeenCalledWith("id");
  });

  it("allows the request without calling Redis when disabled", async () => {
    disable();

    const { checkRateLimit } = await importModule();

    await expect(checkRateLimit("signIn", "id")).resolves.toMatchObject({ success: true });
    expect(limit).not.toHaveBeenCalled();
  });

  // The whole point of failing open: an outage must not lock everyone out.
  it("allows the request when Redis throws", async () => {
    limit.mockRejectedValue(new Error("ECONNREFUSED"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { checkRateLimit } = await importModule();

    await expect(checkRateLimit("signIn", "id")).resolves.toMatchObject({ success: true });
    expect(consoleError).toHaveBeenCalled();
  });

  it("reuses one limiter per action across calls", async () => {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const slidingWindow = Ratelimit.slidingWindow as unknown as ReturnType<typeof vi.fn>;

    const { checkRateLimit } = await importModule();

    await checkRateLimit("signIn", "a");
    await checkRateLimit("signIn", "b");

    expect(slidingWindow).toHaveBeenCalledTimes(1);
  });
});

describe("checkAuthRateLimit", () => {
  it("keys by IP alone when no email is given", async () => {
    const { checkAuthRateLimit } = await importModule();

    await checkAuthRateLimit("register");

    expect(limit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("keys by IP and email together when one is given", async () => {
    const { checkAuthRateLimit } = await importModule();

    await checkAuthRateLimit("signIn", "user@example.com");

    expect(limit).toHaveBeenCalledWith("203.0.113.7:user@example.com");
  });

  // Otherwise the same address in two casings would get two budgets.
  it("normalises the email so casing cannot split the bucket", async () => {
    const { checkAuthRateLimit } = await importModule();

    await checkAuthRateLimit("signIn", "  User@Example.COM  ");

    expect(limit).toHaveBeenCalledWith("203.0.113.7:user@example.com");
  });
});

describe("getClientIp", () => {
  it("takes the client entry from a forwarded chain", async () => {
    headersGet.mockReturnValue("203.0.113.7, 70.41.3.18, 150.172.238.178");

    const { getClientIp } = await importModule();

    await expect(getClientIp()).resolves.toBe("203.0.113.7");
  });

  it("trims surrounding whitespace", async () => {
    headersGet.mockReturnValue("  203.0.113.7  ");

    const { getClientIp } = await importModule();

    await expect(getClientIp()).resolves.toBe("203.0.113.7");
  });

  it.each([
    ["the header is absent", null],
    ["the header is empty", ""],
  ])("buckets every caller together when %s", async (_label, value) => {
    headersGet.mockReturnValue(value);

    const { getClientIp } = await importModule();

    await expect(getClientIp()).resolves.toBe("unknown");
  });
});

describe("time helpers", () => {
  const NOW = new Date("2026-08-06T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("rounds the remaining window up to whole minutes", async () => {
    const { minutesUntilReset } = await importModule();

    expect(minutesUntilReset(NOW.getTime() + 90_000)).toBe(2);
  });

  // A window that has already lapsed still has to read as a positive wait,
  // otherwise the message says "try again in 0 minutes".
  it.each([
    ["already past", -5_000],
    ["a moment away", 500],
  ])("never reports less than a minute when the reset is %s", async (_label, offset) => {
    const { minutesUntilReset } = await importModule();

    expect(minutesUntilReset(NOW.getTime() + offset)).toBe(1);
  });

  it("rounds Retry-After up to whole seconds", async () => {
    const { secondsUntilReset } = await importModule();

    expect(secondsUntilReset(NOW.getTime() + 1_200)).toBe(2);
  });

  it("never reports a Retry-After below one second", async () => {
    const { secondsUntilReset } = await importModule();

    expect(secondsUntilReset(NOW.getTime() - 5_000)).toBe(1);
  });

  it("singularises the message at one minute", async () => {
    const { rateLimitMessage } = await importModule();

    expect(rateLimitMessage(NOW.getTime() + 30_000)).toBe(
      "Too many attempts. Please try again in 1 minute."
    );
  });

  it("pluralises the message beyond one minute", async () => {
    const { rateLimitMessage } = await importModule();

    expect(rateLimitMessage(NOW.getTime() + 14 * 60_000)).toBe(
      "Too many attempts. Please try again in 14 minutes."
    );
  });
});
