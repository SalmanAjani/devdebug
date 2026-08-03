import { DEMO_USER_EMAIL } from "@/lib/db/user";
import { prisma } from "@/lib/prisma";

/** Total collections, for the sidebar badge. Counted in Postgres, not in JS. */
export function getCollectionCount(): Promise<number> {
  return prisma.collection.count({
    where: { user: { email: DEMO_USER_EMAIL } },
  });
}
