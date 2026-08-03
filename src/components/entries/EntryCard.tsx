import { Pin } from "lucide-react";

import { EntryStatusBadge } from "@/components/entries/EntryStatusBadge";
import { Badge } from "@/components/ui/badge";
import { TECH_CATEGORY_CLASS } from "@/lib/constants/entry";
import type { EntryListItem } from "@/lib/db/entries";
import { cn } from "@/lib/utils";

interface EntryCardProps {
  entry: EntryListItem;
}

/**
 * Single debug entry card. Opening the detail panel lands in a later phase.
 *
 * `min-w-0` matters: the card is a grid item, so without it the nowrap error
 * line sets a min-content width that pushes the grid past narrow viewports.
 */
export function EntryCard({ entry }: EntryCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <EntryStatusBadge status={entry.status} />

        {entry.isPinned && (
          <Pin
            role="img"
            aria-label="Pinned"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="text-sm leading-snug font-semibold wrap-break-word">
          {entry.title}
        </h3>
        <p className="line-clamp-2 text-sm wrap-break-word text-muted-foreground">
          {entry.description}
        </p>
      </div>

      {entry.errorMessage && (
        <p className="truncate rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
          {entry.errorMessage}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {entry.technologies.map((tech) => (
          <Badge
            key={tech.id}
            className={cn("gap-1.5", TECH_CATEGORY_CLASS[tech.category])}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {tech.name}
          </Badge>
        ))}

        {entry.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            #{tag.slug}
          </span>
        ))}
      </div>
    </article>
  );
}
