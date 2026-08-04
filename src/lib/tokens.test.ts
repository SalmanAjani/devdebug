import { createHash } from "crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consumeToken, isWithinCooldown, issueToken, scopedIdentifier } from "@/lib/tokens";

interface TokenRow {
  identifier: string;
  expires: Date;
}

/**
 * Only the slice of the client this module touches, typed by hand.
 *
 * Prisma's own signatures insist a `findUnique` resolves to a whole row even
 * when the query `select`s three columns, which makes every fixture below a
 * page of irrelevant nulls.
 */
const { tokens } = vi.hoisted(() => ({
  tokens: {
    create: vi.fn<
      (args: { data: { identifier: string; token: string; expires: Date } }) => Promise<unknown>
    >(),
    deleteMany: vi.fn<(args: { where: Record<string, string> }) => Promise<{ count: number }>>(),
    findFirst: vi.fn<(args: unknown) => Promise<{ expires: Date } | null>>(),
    findUnique: vi.fn<(args: unknown) => Promise<TokenRow | null>>(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: tokens,
    // The real client runs the array as one statement; running them in order is
    // close enough for code that only cares about the results coming back.
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  },
}));

const EMAIL = "dev@example.com";
const HOUR_MS = 60 * 60 * 1000;

/** What `issueToken` should have stored for a given raw token. */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-04T12:00:00Z"));
  tokens.deleteMany.mockResolvedValue({ count: 1 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("scopedIdentifier", () => {
  it("leaves email verification identifiers as the bare address", () => {
    expect(scopedIdentifier("emailVerification", EMAIL)).toBe(EMAIL);
  });

  it("prefixes password reset identifiers", () => {
    expect(scopedIdentifier("passwordReset", EMAIL)).toBe(`password-reset:${EMAIL}`);
  });
});

describe("issueToken", () => {
  it("stores only the hash, and returns the raw token", async () => {
    const raw = await issueToken("passwordReset", EMAIL, HOUR_MS);

    expect(raw).not.toBe("");

    const created = tokens.create.mock.calls[0][0].data;

    expect(created.token).toBe(sha256(raw));
    expect(created.token).not.toBe(raw);
  });

  it("expires the token one TTL from now", async () => {
    await issueToken("passwordReset", EMAIL, HOUR_MS);

    const created = tokens.create.mock.calls[0][0].data;

    expect(created.expires).toEqual(new Date(Date.now() + HOUR_MS));
  });

  it("drops earlier tokens of the same scope only", async () => {
    await issueToken("passwordReset", EMAIL, HOUR_MS);

    expect(tokens.deleteMany).toHaveBeenCalledWith({
      where: { identifier: `password-reset:${EMAIL}` },
    });
    expect(tokens.create.mock.calls[0][0].data.identifier).toBe(`password-reset:${EMAIL}`);
  });

  it("returns a different token every time", async () => {
    const first = await issueToken("passwordReset", EMAIL, HOUR_MS);
    const second = await issueToken("passwordReset", EMAIL, HOUR_MS);

    expect(first).not.toBe(second);
  });
});

describe("consumeToken", () => {
  it("returns the address and consumes the row", async () => {
    tokens.findUnique.mockResolvedValue({
      identifier: `password-reset:${EMAIL}`,
      expires: new Date(Date.now() + HOUR_MS),
    });

    await expect(consumeToken("passwordReset", "raw")).resolves.toEqual({
      ok: true,
      email: EMAIL,
    });
    expect(tokens.deleteMany).toHaveBeenCalledWith({ where: { token: sha256("raw") } });
  });

  it("rejects a token issued for the other scope, and leaves it alone", async () => {
    tokens.findUnique.mockResolvedValue({
      identifier: EMAIL, // an email verification token
      expires: new Date(Date.now() + HOUR_MS),
    });

    await expect(consumeToken("passwordReset", "raw")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(tokens.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects a reset token presented as a verification token", async () => {
    tokens.findUnique.mockResolvedValue({
      identifier: `password-reset:${EMAIL}`,
      expires: new Date(Date.now() + HOUR_MS),
    });

    await expect(consumeToken("emailVerification", "raw")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("reports an expired token, and still consumes it", async () => {
    tokens.findUnique.mockResolvedValue({
      identifier: `password-reset:${EMAIL}`,
      expires: new Date(Date.now() - 1),
    });

    await expect(consumeToken("passwordReset", "raw")).resolves.toEqual({
      ok: false,
      reason: "expired",
    });
    expect(tokens.deleteMany).toHaveBeenCalled();
  });

  it("reports an unknown token as invalid", async () => {
    tokens.findUnique.mockResolvedValue(null);

    await expect(consumeToken("passwordReset", "raw")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("loses the race when another request deleted the row first", async () => {
    tokens.findUnique.mockResolvedValue({
      identifier: `password-reset:${EMAIL}`,
      expires: new Date(Date.now() + HOUR_MS),
    });
    tokens.deleteMany.mockResolvedValue({ count: 0 });

    await expect(consumeToken("passwordReset", "raw")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("isWithinCooldown", () => {
  const COOLDOWN_MS = 60 * 1000;

  /** A row whose `expires` says it was issued `agoMs` ago. */
  function issuedAgo(agoMs: number) {
    return { expires: new Date(Date.now() - agoMs + HOUR_MS) };
  }

  it("is false when no token was ever issued", async () => {
    tokens.findFirst.mockResolvedValue(null);

    await expect(isWithinCooldown("passwordReset", EMAIL, HOUR_MS, COOLDOWN_MS)).resolves.toBe(
      false
    );
  });

  it("is true just inside the window", async () => {
    tokens.findFirst.mockResolvedValue(issuedAgo(COOLDOWN_MS - 1));

    await expect(isWithinCooldown("passwordReset", EMAIL, HOUR_MS, COOLDOWN_MS)).resolves.toBe(
      true
    );
  });

  it("is false once the window has passed", async () => {
    tokens.findFirst.mockResolvedValue(issuedAgo(COOLDOWN_MS));

    await expect(isWithinCooldown("passwordReset", EMAIL, HOUR_MS, COOLDOWN_MS)).resolves.toBe(
      false
    );
  });

  it("looks only at tokens of its own scope", async () => {
    tokens.findFirst.mockResolvedValue(null);

    await isWithinCooldown("passwordReset", EMAIL, HOUR_MS, COOLDOWN_MS);

    expect(tokens.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { identifier: `password-reset:${EMAIL}` } })
    );
  });
});
