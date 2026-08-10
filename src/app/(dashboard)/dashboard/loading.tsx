import { EntriesSectionSkeleton } from "@/components/entries/EntriesSectionSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { RECENTLY_VIEWED_LIMIT } from "@/lib/constants/entry";

/**
 * Shown while the dashboard's Neon queries resolve. The page is force-dynamic,
 * so this renders on every navigation to it, not just the first.
 *
 * Deliberately mirrors the real layout — same container, same card shape, same
 * counts — so nothing shifts when the data lands.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </header>

      <EntriesSectionSkeleton />

      <section className="flex flex-col gap-3">
        <Skeleton className="h-4 w-36" />

        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: RECENTLY_VIEWED_LIMIT }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
