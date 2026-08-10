import { Skeleton } from "@/components/ui/skeleton";

/** Number of placeholder cards — a plausible grid, not a real count. */
const PLACEHOLDER_CARDS = 6;

/** Shown while the collections query resolves. The page is force-dynamic, so
 * this renders on every navigation to it, not just the first. */
export default function CollectionsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28" />
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: PLACEHOLDER_CARDS }, (_, index) => (
          <div
            key={index}
            className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
