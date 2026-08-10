import { EntriesSection } from "@/components/entries/EntriesSection";
import { getPinnedEntries } from "@/lib/db/entries";

// Entries change per request — without this Next prerenders the page at build
// time and bakes the seed data into the output.
export const dynamic = "force-dynamic";

export default async function PinnedPage() {
  const entries = await getPinnedEntries();

  const openCount = entries.filter((entry) => entry.status === "OPEN").length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Pinned</h1>
        <p className="text-sm text-muted-foreground">
          {entries.length} pinned · {openCount} open ·{" "}
          {entries.length - openCount} resolved
        </p>
      </header>

      <EntriesSection
        entries={entries}
        emptyMessage="No pinned entries yet. Pin an entry to keep it here."
      />
    </div>
  );
}
