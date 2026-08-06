import { prisma } from "@/lib/prisma";
import { scopedIdentifier } from "@/lib/tokens";

/**
 * Replaces the password on an account the caller has already authenticated.
 *
 * Returns false when no row matched — the account was deleted between the form
 * rendering and the submit coming back.
 *
 * Any pending reset token is dropped alongside the write. A link that was
 * requested and then abandoned in favour of changing the password directly
 * should not stay live: it would let anyone holding that email undo the change.
 *
 * Sessions need no cleanup — they are JWTs, so there is no row to revoke.
 */
export async function updateUserPassword(
  userId: string,
  email: string,
  hashedPassword: string
): Promise<boolean> {
  const [{ count }] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: scopedIdentifier("passwordReset", email) },
    }),
  ]);

  return count > 0;
}

/**
 * Deletes the account and everything hanging off it.
 *
 * Entries, collections, OAuth accounts, sessions and AI usage go with it
 * through `onDelete: Cascade`. The token rows do not — they are keyed by email
 * address rather than by user id, so an abandoned reset link would outlive the
 * account and then apply to whoever registers that address next.
 */
export async function deleteUserAccount(userId: string, email: string): Promise<void> {
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          in: [
            scopedIdentifier("emailVerification", email),
            scopedIdentifier("passwordReset", email),
          ],
        },
      },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
