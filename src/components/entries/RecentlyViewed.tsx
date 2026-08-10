"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

import { EntryDrawer } from "@/components/entries/EntryDrawer";
import { EntryStatusBadge } from "@/components/entries/EntryStatusBadge";
import type { RecentlyViewedEntry } from "@/lib/db/entries";

interface RecentlyViewedProps {
  entries: RecentlyViewedEntry[];
}

/**
 * The Recently Viewed list, each row opening the same detail drawer as a card.
 *
 * A client component with its own drawer state rather than sharing the grid's:
 * this renders as a sibling of `EntriesSection`, so there is no common client
 * boundary to hold one between them. Two `EntryDrawer`s never show at once —
 * only the list that was clicked has an open entry id.
 */
export function RecentlyViewed({ entries }: RecentlyViewedProps) {
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="size-4" />
        Recently Viewed
      </h2>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
          >
            <EntryStatusBadge status={entry.status} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {entry.title}
            </span>
            <time
              dateTime={entry.viewedAt.toISOString()}
              className="shrink-0 text-xs text-muted-foreground tabular-nums"
            >
              {entry.viewedAt.toISOString().slice(0, 10)}
            </time>

            {/* Stretched over the row for the same reason as on the cards: a
                `button` may not contain the `time` element this row renders. */}
            <button
              type="button"
              onClick={() => setOpenEntryId(entry.id)}
              className="absolute inset-0 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <span className="sr-only">Open {entry.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <EntryDrawer entryId={openEntryId} onClose={() => setOpenEntryId(null)} />
    </section>
  );
}
