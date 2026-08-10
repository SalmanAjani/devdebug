import type { Prisma } from "@/generated/prisma/client";
import { requireUserId } from "@/lib/db/user";
import { prisma } from "@/lib/prisma";

/** The user's total collections, for the sidebar badge. Counted in Postgres, not in JS. */
export async function getCollectionCount(): Promise<number> {
  return prisma.collection.count({
    where: { userId: await requireUserId() },
  });
}

/**
 * Only what a collection card renders. `_count` gives the entry tally in the
 * same query rather than one count per card.
 */
const collectionListSelect = {
  id: true,
  name: true,
  description: true,
  updatedAt: true,
  _count: { select: { entries: true } },
} satisfies Prisma.CollectionSelect;

export type CollectionListItem = Prisma.CollectionGetPayload<{
  select: typeof collectionListSelect;
}>;

/** Every collection belonging to the signed-in user, A–Z. */
export async function getCollections(): Promise<CollectionListItem[]> {
  return prisma.collection.findMany({
    where: { userId: await requireUserId() },
    select: collectionListSelect,
    orderBy: { name: "asc" },
  });
}

/** Name and description for the collection detail header. */
export type CollectionSummary = Pick<
  CollectionListItem,
  "id" | "name" | "description"
>;

/**
 * One collection by id, or null when it does not exist or belongs to someone
 * else — the ownership check is in the `where`, so another user's id reads as
 * missing rather than as a collection the caller may see.
 */
export async function getCollection(
  id: string
): Promise<CollectionSummary | null> {
  return prisma.collection.findFirst({
    where: { id, userId: await requireUserId() },
    select: { id: true, name: true, description: true },
  });
}
