import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stands in while the detail fetch is in flight.
 *
 * Mirrors the real section rhythm — label, then body — so the drawer does not
 * visibly reflow when the entry lands.
 */
export function EntryDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-5" aria-hidden>
      {[...Array(3)].map((_, section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}
