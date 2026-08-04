import { prisma } from "@/lib/prisma";

/**
 * Authentication ships in a later phase. Until then every query is scoped to
 * the seeded demo user, so swapping in the session user is a one-line change.
 */
export const DEMO_USER_EMAIL = "demo@devdebug.com";

/** What the sidebar footer renders. */
export interface CurrentUser {
  name: string;
  email: string;
  image: string | null;
  initials: string;
}

/** "Demo Developer" -> "DD". Falls back to the email when the name is unset. */
function toInitials(source: string): string {
  const words = source.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

/**
 * The signed-in user, stubbed to the seeded demo account until auth lands.
 *
 * Returns null on a database with no demo user — a fresh clone before
 * `npm run db:seed` — so the shell renders instead of throwing.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { name: true, email: true, image: true },
  });

  if (!user) return null;

  // `||`, not `??`: `name` is free-form and nullable, so an empty or
  // whitespace-only string has to fall back too or the avatar renders blank.
  const name = user.name?.trim() || user.email;

  return { name, email: user.email, image: user.image, initials: toInitials(name) };
}
