import { FolderPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Top bar with global search and the new entry action. Display only for now. */
export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <div className="relative mx-auto w-full max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search entries, errors, root causes..."
          aria-label="Search debug entries"
          className="h-9 pr-14 pl-9"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <Button variant="outline" size="lg" className="shrink-0">
        <FolderPlus />
        <span className="hidden sm:inline">New Collection</span>
      </Button>

      <Button size="lg" className="shrink-0">
        <Plus />
        <span className="hidden sm:inline">New Debug Entry</span>
      </Button>
    </header>
  );
}
