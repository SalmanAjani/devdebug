"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface EntryToolbarProps {
  /** 1-based index of the visible page. */
  page: number;
  pageCount: number;
  /** 1-based position of the first and last visible entry. */
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const FILTERS = ["Status", "Technology", "Collection"];

export function EntryToolbar({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPreviousPage,
  onNextPage,
}: EntryToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <SlidersHorizontal className="size-4" />
        Filter
      </span>

      {/* Display only until filtering ships. */}
      {FILTERS.map((filter) => (
        <Button key={filter} variant="outline" size="sm">
          {filter}
          <ChevronDown data-icon="inline-end" />
        </Button>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {rangeStart}–{rangeEnd} of {total}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onPreviousPage}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onNextPage}
            disabled={page === pageCount}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>

        {/* Display only until the list view ships. */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          <Button variant="ghost" size="icon-xs" aria-pressed aria-label="Grid view" className="bg-muted">
            <LayoutGrid />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-pressed={false}
            aria-label="List view"
            className="text-muted-foreground"
          >
            <List />
          </Button>
        </div>
      </div>
    </div>
  );
}
