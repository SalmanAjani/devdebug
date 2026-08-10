import Link from "next/link";
import { FolderOpen } from "lucide-react";

import type { CollectionListItem } from "@/lib/db/collections";

interface CollectionCardProps {
  collection: CollectionListItem;
}

/**
 * Single collection card, linking to its entries.
 *
 * The whole card is the link rather than a nested anchor on the title — the
 * card has no other interactive target, so one focus stop is the right count.
 * `min-w-0` for the same reason as `EntryCard`: it is a grid item wrapping
 * text that would otherwise set a wide min-content width.
 */
export function CollectionCard({ collection }: CollectionCardProps) {
  const entryCount = collection._count.entries;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex h-full min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-lg focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FolderOpen className="size-4" />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="text-sm leading-snug font-semibold wrap-break-word">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="line-clamp-2 text-sm wrap-break-word text-muted-foreground">
            {collection.description}
          </p>
        )}
      </div>
    </Link>
  );
}
