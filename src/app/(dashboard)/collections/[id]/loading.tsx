import { EntriesSectionSkeleton } from "@/components/entries/EntriesSectionSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while one collection and its entries resolve. The page is
 * force-dynamic, so this renders on every navigation to it. */
export default function CollectionLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </header>

      <EntriesSectionSkeleton />
    </div>
  );
}
