import { EntriesSectionSkeleton } from "@/components/entries/EntriesSectionSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the pinned query resolves. The page is force-dynamic, so this
 * renders on every navigation to it, not just the first. */
export default function PinnedLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </header>

      <EntriesSectionSkeleton />
    </div>
  );
}
