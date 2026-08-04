import { Skeleton } from "@/components/ui/skeleton";
import { ENTRIES_PAGE_SIZE, RECENTLY_VIEWED_LIMIT } from "@/lib/constants/entry";

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
