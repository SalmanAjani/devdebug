import { Bug, FolderOpen } from "lucide-react";

interface ProfileStatsProps {
  entries: number;
  collections: number;
}

/** Entry and collection totals, as a pair of tiles. */
export function ProfileStats({ entries, collections }: ProfileStatsProps) {
  const stats = [
    { label: "Debug entries", value: entries, icon: Bug },
    { label: "Collections", value: collections, icon: FolderOpen },
  ];

  return (
    <section className="grid grid-cols-2 gap-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-5"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="size-4" />
            {label}
          </span>
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
        </div>
      ))}
    </section>
  );
}
