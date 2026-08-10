import { Skeleton } from "@/components/ui/skeleton";
import { ENTRIES_PAGE_SIZE } from "@/lib/constants/entry";

/**
 * Placeholder for `EntriesSection` — the toolbar plus a full page of cards.
 *
 * Mirrors the real layout closely enough that nothing shifts when the data
 * lands. Shared by every route that renders the entry grid.
 */
export function EntriesSectionSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      {/* Toolbar: filter chips on the left, range and paging on the right. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="ml-auto h-8 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: ENTRIES_PAGE_SIZE }, (_, index) => (
          <div
            key={index}
            className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="h-5 w-20 rounded-full" />

            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <Skeleton className="h-7 w-full" />

            <div className="mt-auto flex items-center gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
