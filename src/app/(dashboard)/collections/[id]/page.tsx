import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { EntriesSection } from "@/components/entries/EntriesSection";
import { getCollection } from "@/lib/db/collections";
import { getEntriesByCollection } from "@/lib/db/entries";

// Entries change per request — without this Next prerenders the page at build
// time and bakes the seed data into the output.
export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;

  // Ownership lives in the query, so someone else's collection 404s here.
  const collection = await getCollection(id);

  if (!collection) notFound();

  const entries = await getEntriesByCollection(collection.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/collections"
          className="flex w-fit items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-4" />
          Collections
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
      </header>

      <EntriesSection
        entries={entries}
        emptyMessage="This collection has no entries yet."
      />
    </div>
  );
}
