import { EntriesSection } from "@/components/entries/EntriesSection";
import { RecentlyViewed } from "@/components/entries/RecentlyViewed";
import { RECENTLY_VIEWED_LIMIT } from "@/lib/constants/entry";
import { getEntries, getRecentlyViewedEntries } from "@/lib/db/entries";

// Entries change per request — without this Next prerenders the page at build
// time and bakes the seed data into the output.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Entries come back ordered by the query — pinned first, then newest.
  const [entries, recentlyViewed] = await Promise.all([
    getEntries(),
    getRecentlyViewedEntries(RECENTLY_VIEWED_LIMIT),
  ]);

  const openCount = entries.filter((entry) => entry.status === "OPEN").length;

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
