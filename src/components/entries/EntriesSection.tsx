"use client";

import { useState } from "react";

import { EntryCard } from "@/components/entries/EntryCard";
import { EntryToolbar } from "@/components/entries/EntryToolbar";
import { ENTRIES_PAGE_SIZE } from "@/lib/constants/entry";
import type { EntryListItem } from "@/lib/db/entries";

interface EntriesSectionProps {
  /** Already ordered by the query — pinned first, then newest. */
  entries: EntryListItem[];
  /** Shown in place of the grid when there is nothing to list. */
  emptyMessage?: string;
}

/** Toolbar plus the paginated grid of entry cards. */
export function EntriesSection({
  entries,
  emptyMessage = "No debug entries yet. Your first one will show up here.",
}: EntriesSectionProps) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(entries.length / ENTRIES_PAGE_SIZE));
  const startIndex = (page - 1) * ENTRIES_PAGE_SIZE;
  const visibleEntries = entries.slice(startIndex, startIndex + ENTRIES_PAGE_SIZE);

  return (
    <section className="flex flex-col gap-4">
      <EntryToolbar
        page={page}
        pageCount={pageCount}
        rangeStart={entries.length === 0 ? 0 : startIndex + 1}
        rangeEnd={startIndex + visibleEntries.length}
        total={entries.length}
        onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => Math.min(pageCount, current + 1))}
      />

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
