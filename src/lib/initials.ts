/**
 * "John Doe" -> "JD". Falls back to the first two characters of a single word,
 * which also covers the email address `getCurrentUser` substitutes for a blank
 * name.
 *
 * Its own module rather than a member of `lib/db/user.ts`: the avatar renders
 * on the client, and that file reaches Prisma through `@/auth`.
 */
export function toInitials(source: string): string {
  const words = source.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
