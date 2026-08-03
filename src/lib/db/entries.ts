import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Authentication ships in a later phase. Until then every query is scoped to
 * the seeded demo user, so swapping in the session user is a one-line change.
 */
const DEMO_USER_EMAIL = "demo@devdebug.com";

/** Only the columns the entry cards render — the list never needs the long text. */
const entryListSelect = {
  id: true,
  title: true,
  description: true,
  errorMessage: true,
  status: true,
  isPinned: true,
  createdAt: true,
  technologies: {
    select: { id: true, name: true, slug: true, category: true },
    orderBy: { name: "asc" },
  },
  tags: {
    select: { id: true, name: true, slug: true },
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
