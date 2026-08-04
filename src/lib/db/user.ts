import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { toInitials } from "@/lib/initials";
import { prisma } from "@/lib/prisma";

/** What the sidebar footer and profile page render. */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  initials: string;
}

/**
 * The signed-in user's id, or a redirect to sign-in.
 *
 * Every query over user-owned data goes through this rather than trusting an
 * id passed down from a caller — see "User Data Scoping" in the coding
 * standards. The proxy already blocks unauthenticated `/dashboard` requests;
 * this is the second line, and it covers routes the matcher does not.
 *
 * `cache` dedupes it per request — the dashboard layout alone fans out into
 * four scoped queries, and they should not each decode the token again.
 */
export const requireUserId = cache(async (): Promise<string> => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session.user.id;
});

/**
 * The signed-in user, read fresh from the database.
 *
 * The JWT carries a name and image too, but they are a snapshot from sign-in.
 * Reading the row means a profile edit shows up on the next request, and a
 * deleted account stops rendering as a live user while its token is still valid.
 *
 * Returns null when there is no session, so the shell renders instead of
 * throwing on a signed-out request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) return null;

  // `||`, not `??`: `name` is free-form and nullable, so an empty or
  // whitespace-only string has to fall back too or the avatar renders blank.
  const name = user.name?.trim() || user.email;

  return {
    id: user.id,
    name,
    email: user.email,
    image: user.image,
    initials: toInitials(name),
  };
});
