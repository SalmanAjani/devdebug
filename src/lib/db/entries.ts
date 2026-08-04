import type { Prisma } from "@/generated/prisma/client";
import { DEMO_USER_EMAIL } from "@/lib/db/user";
import { prisma } from "@/lib/prisma";

/**
 * Only the columns the entry cards render — the list never needs the long text.
 *
 * `createdAt` is absent on purpose: the cards don't show a date, and ordering
 * by a column doesn't require selecting it.
 */
const entryListSelect = {
  id: true,
  title: true,
  description: true,
  errorMessage: true,
  status: true,
  isPinned: true,
  technologies: {
    // The badge renders `name`; `slug` is for routing and isn't needed here.
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  },
  tags: {
    // The card renders `#{slug}`, so the display `name` stays behind.
    select: { id: true, slug: true },
    orderBy: { name: "asc" },
  },
} satisfies Prisma.DebugEntrySelect;

export type EntryListItem = Prisma.DebugEntryGetPayload<{
  select: typeof entryListSelect;
}>;

/**
 * Every entry for the dashboard grid, pinned first then newest.
 *
 * Pagination is client-side for now, so the whole list is fetched in one query
 * — technologies and tags come along with it to avoid an N+1 per card.
 */
export async function getEntries(): Promise<EntryListItem[]> {
  return prisma.debugEntry.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    select: entryListSelect,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

/** The Recently Viewed rows are a single line each — far less than a card needs. */
const recentlyViewedSelect = {
  id: true,
  title: true,
  status: true,
  viewedAt: true,
} satisfies Prisma.DebugEntrySelect;

/** `viewedAt` is nullable in the schema but never null in this result. */
export type RecentlyViewedEntry = Prisma.DebugEntryGetPayload<{
  select: typeof recentlyViewedSelect;
}> & { viewedAt: Date };

/** The most recently opened entries, newest first. Never-opened entries are excluded. */
export async function getRecentlyViewedEntries(
  limit: number
): Promise<RecentlyViewedEntry[]> {
  const entries = await prisma.debugEntry.findMany({
    where: { user: { email: DEMO_USER_EMAIL }, viewedAt: { not: null } },
    select: recentlyViewedSelect,
    orderBy: { viewedAt: "desc" },
    take: limit,
  });

  // The `where` already excludes nulls — this narrows the type without a cast.
  return entries.filter(
    (entry): entry is RecentlyViewedEntry => entry.viewedAt !== null
  );
}

/** Total entries, for the sidebar badge. Counted in Postgres, not in JS. */
export function getEntryCount(): Promise<number> {
  return prisma.debugEntry.count({
    where: { user: { email: DEMO_USER_EMAIL } },
  });
}

/** Pinned entries only, for the sidebar badge. */
export function getPinnedEntryCount(): Promise<number> {
  return prisma.debugEntry.count({
    where: { user: { email: DEMO_USER_EMAIL }, isPinned: true },
  });
}
