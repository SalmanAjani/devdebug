import { prisma } from "@/lib/prisma";
import {
  consumeToken,
  isWithinCooldown,
  issueToken,
  revokeTokens,
  scopedIdentifier,
  type TokenResult,
} from "@/lib/tokens";

/**
 * How long a reset link stays usable.
 *
 * An hour rather than the 24 the verification link gets: this one hands over
 * the account outright, so the window in which a forwarded or archived email is
 * dangerous should be as short as still being convenient allows.
 */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Minimum gap between two reset emails to the same address. */
export const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;

/**
 * Issues a fresh reset token for `email` and returns the raw value to put in
 * the link. Any earlier reset token for the address is dropped, so the newest
 * link is the only one that works.
 */
export function createPasswordResetToken(email: string): Promise<string> {
  return issueToken("passwordReset", email, PASSWORD_RESET_TOKEN_TTL_MS);
}

export type PasswordResetResult = TokenResult;

/** Redeems a raw reset token, consuming it in the process. */
export function consumePasswordResetToken(rawToken: string): Promise<PasswordResetResult> {
  return consumeToken("passwordReset", rawToken);
}

/**
 * Drops any reset token for `email`.
 *
 * Used when the email never made it out: the token exists by then, and the
 * cooldown is measured from it, so leaving it there would make the user's
 * retry look successful while sending nothing.
 */
export function revokePasswordResetTokens(email: string): Promise<void> {
  return revokeTokens("passwordReset", email);
}

/** Whether the last reset email to `email` went out too recently to send another. */
export function isWithinPasswordResetCooldown(email: string): Promise<boolean> {
  return isWithinCooldown(
    "passwordReset",
    email,
    PASSWORD_RESET_TOKEN_TTL_MS,
    PASSWORD_RESET_COOLDOWN_MS
  );
}

/**
 * Writes the new password and clears out everything the old one left behind.
 *
 * Returns false when no account matched — the address was deleted between the
 * link going out and the form coming back.
 *
 * Three things happen together, in one transaction so a partial reset cannot
 * survive a failure:
 *
 * 1. The password is replaced.
 * 2. `emailVerified` is stamped if it was still null. Following a link sent to
 *    the address proves the same thing the verification link proves, and
 *    without this a user who never verified would reset their password and
 *    still be refused at sign-in.
 * 3. Any pending verification token is dropped, since (2) just made it moot.
 *
 * Sessions need no cleanup: they are JWTs, so there is no row to revoke.
 */
export async function resetUserPassword(
  email: string,
  hashedPassword: string
): Promise<boolean> {
  const [{ count }] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { email },
      data: { password: hashedPassword },
    }),
    prisma.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: scopedIdentifier("emailVerification", email) },
    }),
  ]);

  return count > 0;
}
