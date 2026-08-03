import { Clock } from "lucide-react";

import { EntryStatusBadge } from "@/components/entries/EntryStatusBadge";
import type { RecentlyViewedEntry } from "@/lib/db/entries";

interface RecentlyViewedProps {
  entries: RecentlyViewedEntry[];
}

export function RecentlyViewed({ entries }: RecentlyViewedProps) {
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
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
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
          </li>
        ))}
      </ul>
    </section>
  );
}
