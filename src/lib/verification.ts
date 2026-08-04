import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

/** How long a verification link stays usable. */
export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between two verification emails to the same address. */
export const RESEND_COOLDOWN_MS = 60 * 1000;

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
 * Issues a fresh verification token for `email` and returns the raw value to
 * put in the link.
 *
 * Earlier tokens for the same address are dropped, so requesting a new link
 * invalidates the old one instead of leaving several live at once.
 */
export async function createVerificationToken(email: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(rawToken),
        expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    }),
  ]);

  return rawToken;
}

export type VerificationFailure = "invalid" | "expired";

export type VerificationResult =
  | { ok: true; email: string }
  | { ok: false; reason: VerificationFailure };

/**
 * Redeems a raw token, consuming it in the process.
 *
 * The row is deleted whether or not it had expired: a link works once and only
 * once, and an expired one is dead weight. "Already used" is indistinguishable
 * from "never existed" by design — both come back as `invalid`.
 */
export async function consumeVerificationToken(
  rawToken: string
): Promise<VerificationResult> {
  const token = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token },
    select: { identifier: true, expires: true },
  });

  if (!record) return { ok: false, reason: "invalid" };

  // `deleteMany` rather than `delete` so a second request racing this one gets
  // a count of 0 instead of a thrown P2025 — and loses, as it should.
  const { count } = await prisma.verificationToken.deleteMany({ where: { token } });

  if (count === 0) return { ok: false, reason: "invalid" };

  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email: record.identifier };
}

/**
 * Whether the last verification email to `email` went out too recently to send
 * another.
 *
 * `verification_tokens` has no `createdAt`, but it does not need one: this code
 * sets every `expires` to issue time plus the TTL, so subtracting the TTL back
 * off recovers exactly when the token was handed out.
 */
export async function isWithinResendCooldown(email: string): Promise<boolean> {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });

  if (!latest) return false;

  const issuedAt = latest.expires.getTime() - VERIFICATION_TOKEN_TTL_MS;

  return Date.now() - issuedAt < RESEND_COOLDOWN_MS;
}

/**
 * Stamps `emailVerified` on an unverified account. Returns false when there was
 * nothing to verify — no such user, or someone got there first.
 *
 * `updateMany` with the `emailVerified: null` filter keeps this idempotent: a
 * replayed link cannot move an existing verification date.
 */
export async function markEmailVerified(email: string): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { email, emailVerified: null },
    data: { emailVerified: new Date() },
  });

  return count > 0;
}
