import { CollectionCard } from "@/components/collections/CollectionCard";
import { getCollections } from "@/lib/db/collections";

// Collections change per request — without this Next prerenders the page at
// build time and bakes the seed data into the output.
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Collections</h1>
        <p className="text-sm text-muted-foreground">
          {collections.length}{" "}
          {collections.length === 1 ? "collection" : "collections"}
        </p>
      </header>

      {collections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No collections yet. Group related entries and they will show up here.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
