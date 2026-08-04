import { requireUserId } from "@/lib/db/user";
import { prisma } from "@/lib/prisma";

/** The user's total collections, for the sidebar badge. Counted in Postgres, not in JS. */
export async function getCollectionCount(): Promise<number> {
  return prisma.collection.count({
    where: { userId: await requireUserId() },
  });
}
