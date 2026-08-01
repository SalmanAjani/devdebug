import { EntriesSection } from "@/components/entries/EntriesSection";
import {
  RecentlyViewed,
  type ViewedEntry,
} from "@/components/entries/RecentlyViewed";
import { RECENTLY_VIEWED_LIMIT } from "@/lib/constants/entry";
import { MOCK_ENTRIES } from "@/lib/mock-data";

export default function DashboardPage() {
  // Pinned first, then newest — the ordering the Prisma query will use later.
  const entries = [...MOCK_ENTRIES].sort(
    (a, b) =>
      Number(b.isPinned) - Number(a.isPinned) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  const openCount = entries.filter((entry) => entry.status === "OPEN").length;

  const recentlyViewed = entries
    .filter((entry): entry is ViewedEntry => entry.viewedAt !== null)
    .sort((a, b) => Date.parse(b.viewedAt) - Date.parse(a.viewedAt))
    .slice(0, RECENTLY_VIEWED_LIMIT);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">All Debug Entries</h1>
        <p className="text-sm text-muted-foreground">
          {entries.length} entries · {openCount} open ·{" "}
          {entries.length - openCount} resolved
        </p>
      </header>

      <EntriesSection entries={entries} />

      <RecentlyViewed entries={recentlyViewed} />
    </div>
  );
}
