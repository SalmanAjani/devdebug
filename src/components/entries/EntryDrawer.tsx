"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Copy, FolderOpen, Pencil, Pin, Tag, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EntryDrawerSkeleton } from "@/components/entries/EntryDrawerSkeleton";
import { EntryStatusBadge } from "@/components/entries/EntryStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TECH_CATEGORY_CLASS } from "@/lib/constants/entry";
import type { EntryDetail } from "@/lib/db/entries";
import { cn } from "@/lib/utils";

interface EntryDrawerProps {
  /** The entry to show. Null closes the drawer. */
  entryId: string | null;
  onClose: () => void;
}

/** One labelled block of the detail body. */
function Section({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5 border-b border-border px-4 py-4 last:border-b-0">
      <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </h3>
      {children}
    </section>
  );
}

/**
 * Slide-in detail panel for a debug entry.
 *
 * The card list only holds what a card renders, so the long text is fetched
 * here on open rather than shipped with every card in the grid.
 */
/** What the fetch produced, tagged with the entry it was for. */
type DetailState =
  | { id: string; status: "loaded"; entry: EntryDetail }
  | { id: string; status: "failed"; message: string };

export function EntryDrawer({ entryId, onClose }: EntryDrawerProps) {
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;

    // A fast second click must not let a slow first response overwrite it.
    const controller = new AbortController();

    fetch(`/api/entries/${entryId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load this entry.");
        const entry: EntryDetail = await response.json();
        setDetail({ id: entryId, status: "loaded", entry });
      })
      .catch((cause: Error) => {
        if (cause.name === "AbortError") return;
        setDetail({ id: entryId, status: "failed", message: cause.message });
      });

    return () => controller.abort();
  }, [entryId]);

  // Tagging the state by id is what makes the reset unnecessary: last opening's
  // result is simply not this entry's, so it reads as loading rather than
  // flashing the previous entry.
  const current = detail?.id === entryId ? detail : null;
  const entry = current?.status === "loaded" ? current.entry : null;
  const error = current?.status === "failed" ? current.message : null;
  const copied = copiedId !== null && copiedId === entryId;

  const handleCopy = async () => {
    if (!entry) return;

    const parts = [
      `# ${entry.title}`,
      `## Description\n${entry.description}`,
      entry.errorMessage && `## Error Message\n${entry.errorMessage}`,
      `## Root Cause\n${entry.rootCause}`,
      `## Solution\n${entry.solution}`,
      entry.codeSnippet &&
        `## Code Snippet\n\`\`\`${entry.codeLanguage ?? ""}\n${entry.codeSnippet}\n\`\`\``,
    ].filter(Boolean);

    await navigator.clipboard.writeText(parts.join("\n\n"));
    setCopiedId(entry.id);
  };

  return (
    <Sheet
      open={entryId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <header className="flex flex-col gap-2 border-b border-border px-4 py-4 pr-12">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Code2 className="size-4" />
            </span>

            <SheetTitle className="min-w-0 text-base leading-snug wrap-break-word">
              {entry?.title ?? "Loading entry…"}
            </SheetTitle>
          </div>

          {entry && (
            <div className="flex flex-wrap items-center gap-1.5">
              <EntryStatusBadge status={entry.status} />

              {entry.technologies.map((tech) => (
                <Badge
                  key={tech.id}
                  className={cn("gap-1.5", TECH_CATEGORY_CLASS[tech.category])}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {tech.name}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <div className="flex items-center gap-1 border-b border-border px-3 py-2">
          <Button variant="ghost" size="sm" disabled={!entry}>
            <Pin
              className={cn(entry?.isPinned && "fill-current text-foreground")}
            />
            {entry?.isPinned ? "Pinned" : "Pin"}
          </Button>

          <Button variant="ghost" size="sm" disabled={!entry} onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button variant="ghost" size="sm" className="ml-auto" disabled={!entry}>
            <Pencil />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={!entry}
          >
            <Trash2 />
            Delete
          </Button>
        </div>

        {error ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {error}
          </p>
        ) : !entry ? (
          <EntryDrawerSkeleton />
        ) : (
          <div className="flex flex-col">
            <Section label="Description">
              <p className="text-sm wrap-break-word whitespace-pre-wrap">
                {entry.description}
              </p>
            </Section>

            {entry.errorMessage && (
              <Section label="Error Message">
                <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                  {entry.errorMessage}
                </pre>
              </Section>
            )}

            <Section label="Root Cause">
              <p className="text-sm wrap-break-word whitespace-pre-wrap">
                {entry.rootCause}
              </p>
            </Section>

            <Section label="Solution">
              <p className="text-sm wrap-break-word whitespace-pre-wrap">
                {entry.solution}
              </p>
            </Section>

            {entry.codeSnippet && (
              <Section
                label={`Code Snippet${entry.codeLanguage ? ` · ${entry.codeLanguage}` : ""}`}
              >
                <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
                  {entry.codeSnippet}
                </pre>
              </Section>
            )}

            {entry.tags.length > 0 && (
              <Section label="Tags" icon={Tag}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      #{tag.slug}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {entry.collections.length > 0 && (
              <Section label="Collections" icon={FolderOpen}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.collections.map((collection) => (
                    <Badge key={collection.id} variant="secondary">
                      {collection.name}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
