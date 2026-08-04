import { prisma } from "@/lib/prisma";
import {
  consumeToken,
  isWithinCooldown,
  issueToken,
  type TokenResult,
} from "@/lib/tokens";

/** How long a verification link stays usable. */
export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between two verification emails to the same address. */
export const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * Issues a fresh verification token for `email` and returns the raw value to
 * put in the link. Any earlier verification token for the address is dropped.
 */
export function createVerificationToken(email: string): Promise<string> {
  return issueToken("emailVerification", email, VERIFICATION_TOKEN_TTL_MS);
}

export type VerificationResult = TokenResult;

/** Redeems a raw verification token, consuming it in the process. */
export function consumeVerificationToken(rawToken: string): Promise<VerificationResult> {
  return consumeToken("emailVerification", rawToken);
}

/** Whether the last verification email to `email` went out too recently to send another. */
export function isWithinResendCooldown(email: string): Promise<boolean> {
  return isWithinCooldown(
    "emailVerification",
    email,
    VERIFICATION_TOKEN_TTL_MS,
    RESEND_COOLDOWN_MS
  );
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
