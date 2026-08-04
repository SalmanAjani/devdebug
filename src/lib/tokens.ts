import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

/**
 * Single-use email tokens, stored in `verification_tokens`.
 *
 * Two flows share that table — confirming an address and resetting a password —
 * so the row has to say which one it belongs to. The only column available for
 * that is `identifier`, hence the prefixes below.
 */
export type TokenScope = "emailVerification" | "passwordReset";

/**
 * Prefix that marks a reset token's identifier.
 *
 * Email verification deliberately has none: it stores the bare address, and
 * rows written before password reset existed have to keep working. A colon can
 * only appear in an address inside a quoted local part, which the Zod email
 * validator rejects long before anything reaches here.
 */
const PASSWORD_RESET_PREFIX = "password-reset:";

/** Turns an address into the identifier a token of this scope is filed under. */
export function scopedIdentifier(scope: TokenScope, email: string): string {
  return scope === "passwordReset" ? `${PASSWORD_RESET_PREFIX}${email}` : email;
}

/** Which flow an identifier belongs to. Total by construction — every row has exactly one scope. */
function scopeOf(identifier: string): TokenScope {
  return identifier.startsWith(PASSWORD_RESET_PREFIX) ? "passwordReset" : "emailVerification";
}

/** Recovers the address an identifier was built from. */
function emailOf(identifier: string): string {
  return scopeOf(identifier) === "passwordReset"
    ? identifier.slice(PASSWORD_RESET_PREFIX.length)
    : identifier;
}

/**
 * Only the hash is stored. A leaked `verification_tokens` table then hands out
 * nothing usable — the raw token exists in the email and nowhere else.
 *
 * Plain SHA-256 rather than bcrypt on purpose: the input is 256 bits of CSPRNG
 * output, so there is no dictionary to slow an attacker down against, and the
 * lookup has to hit a unique index.
 */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a fresh token of `scope` for `email` and returns the raw value to put
 * in the link.
 *
 * Earlier tokens of the same scope are dropped, so requesting a new link
 * invalidates the old one instead of leaving several live at once. Tokens of
 * the *other* scope survive — the prefix keeps a password reset request from
 * quietly killing a pending verification link, and vice versa.
 */
export async function issueToken(
  scope: TokenScope,
  email: string,
  ttlMs: number
): Promise<string> {
  const identifier = scopedIdentifier(scope, email);
  const rawToken = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(rawToken),
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return rawToken;
}

export type TokenFailure = "invalid" | "expired";

export type TokenResult =
  | { ok: true; email: string }
  | { ok: false; reason: TokenFailure };

/**
 * Redeems a raw token, consuming it in the process.
 *
 * The row is deleted whether or not it had expired: a link works once and only
 * once, and an expired one is dead weight. "Already used" is indistinguishable
 * from "never existed" by design — both come back as `invalid`, as does a token
 * belonging to the other flow.
 */
export async function consumeToken(
  scope: TokenScope,
  rawToken: string
): Promise<TokenResult> {
  const token = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token },
    select: { identifier: true, expires: true },
  });

  if (!record) return { ok: false, reason: "invalid" };

  // A verification link pasted into the reset form is not a reset token. Refuse
  // it, and leave the row alone so the link it belongs to still works.
  if (scopeOf(record.identifier) !== scope) return { ok: false, reason: "invalid" };

  // `deleteMany` rather than `delete` so a second request racing this one gets
  // a count of 0 instead of a thrown P2025 — and loses, as it should.
  const { count } = await prisma.verificationToken.deleteMany({ where: { token } });

  if (count === 0) return { ok: false, reason: "invalid" };

  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email: emailOf(record.identifier) };
}

/** Drops every token of `scope` for `email`, redeemed or not. */
export async function revokeTokens(scope: TokenScope, email: string): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: { identifier: scopedIdentifier(scope, email) },
  });
}

/**
 * Whether the last email of `scope` to `email` went out too recently to send
 * another.
 *
 * `verification_tokens` has no `createdAt`, but it does not need one: this code
 * sets every `expires` to issue time plus the TTL, so subtracting the TTL back
 * off recovers exactly when the token was handed out.
 */
export async function isWithinCooldown(
  scope: TokenScope,
  email: string,
  ttlMs: number,
  cooldownMs: number
): Promise<boolean> {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: scopedIdentifier(scope, email) },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });

  if (!latest) return false;

  const issuedAt = latest.expires.getTime() - ttlMs;

  return Date.now() - issuedAt < cooldownMs;
}
