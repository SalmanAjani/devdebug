"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

import { updateEntry } from "@/actions/entries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_CONFIG } from "@/lib/constants/entry";
import type { EntryDetail } from "@/lib/db/entries";
import { EntryStatus } from "@/generated/prisma/enums";
import type { UpdateEntryFormValues } from "@/lib/validations/entry";
import { cn } from "@/lib/utils";

interface EntryEditFormProps {
  entry: EntryDetail;
  /** Hands back the saved entry so the drawer can show it without re-fetching. */
  onSaved: (entry: EntryDetail) => void;
  onCancel: () => void;
}

/** The form's starting values, taken from the entry as the drawer has it. */
function toFormValues(entry: EntryDetail): UpdateEntryFormValues {
  return {
    title: entry.title,
    status: entry.status,
    description: entry.description,
    // Nullable columns render as an empty field, not the string "null".
    errorMessage: entry.errorMessage ?? "",
    rootCause: entry.rootCause,
    solution: entry.solution,
    codeSnippet: entry.codeSnippet ?? "",
    // Tags are edited as the comma-separated line the user typed; the server
    // splits it. Display names, not slugs — "#race-condition" is for reading.
    tags: entry.tags.map((tag) => tag.slug).join(", "),
  };
}

/** One labelled field, matching the view mode's section rhythm. */
function EditField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border px-4 py-4 last:border-b-0">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </Label>
      {children}
      {error?.[0] && <p className="text-xs text-destructive">{error[0]}</p>}
    </div>
  );
}

/**
 * Edit mode for the entry drawer.
 *
 * Controlled inputs over local state rather than a form library — this is eight
 * fields with one required among them, and `useState` covers that without the
 * dependency. The server action is still the authority on what is valid; the
 * disabled Save button below is only there to stop the obvious mistake early.
 */
export function EntryEditForm({ entry, onSaved, onCancel }: EntryEditFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(() => toFormValues(entry));
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [isSaving, startSaving] = useTransition();

  const setField = <K extends keyof UpdateEntryFormValues>(
    field: K,
    value: UpdateEntryFormValues[K]
  ) => setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    startSaving(async () => {
      const result = await updateEntry(entry.id, values);

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }

      setFieldErrors({});
      toast.success("Entry updated");

      // The action returned the saved entry, so the drawer switches straight
      // back to view mode with it. The refresh is for what is behind the
      // drawer — the card grid and sidebar counts are server-rendered.
      onSaved(result.data);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button type="submit" size="sm" disabled={isSaving || !values.title.trim()}>
          {isSaving && <Loader2 className="animate-spin" />}
          {isSaving ? "Saving…" : "Save"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSaving}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>

      <EditField label="Title" htmlFor="entry-title" error={fieldErrors.title}>
        <Input
          id="entry-title"
          value={values.title}
          onChange={(event) => setField("title", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.title}
          className="h-9"
        />
      </EditField>

      <div className="flex flex-col gap-1.5 border-b border-border px-4 py-4">
        <span className="text-xs font-medium text-muted-foreground">Status</span>

        <div className="flex items-center gap-1.5">
          {Object.values(EntryStatus).map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isSelected = values.status === status;

            return (
              <button
                key={status}
                type="button"
                disabled={isSaving}
                onClick={() => setField("status", status)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                  isSelected
                    ? config.className
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <EditField
        label="Description"
        htmlFor="entry-description"
        error={fieldErrors.description}
      >
        <Textarea
          id="entry-description"
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.description}
          className="min-h-24"
        />
      </EditField>

      <EditField
        label="Error Message"
        htmlFor="entry-error-message"
        error={fieldErrors.errorMessage}
      >
        <Textarea
          id="entry-error-message"
          value={values.errorMessage}
          onChange={(event) => setField("errorMessage", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.errorMessage}
          className="min-h-20 font-mono text-xs"
        />
      </EditField>

      <EditField
        label="Root Cause"
        htmlFor="entry-root-cause"
        error={fieldErrors.rootCause}
      >
        <Textarea
          id="entry-root-cause"
          value={values.rootCause}
          onChange={(event) => setField("rootCause", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.rootCause}
          className="min-h-20"
        />
      </EditField>

      <EditField
        label="Solution"
        htmlFor="entry-solution"
        error={fieldErrors.solution}
      >
        <Textarea
          id="entry-solution"
          value={values.solution}
          onChange={(event) => setField("solution", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.solution}
          className="min-h-20"
        />
      </EditField>

      <EditField
        label={`Code Snippet${entry.codeLanguage ? ` · ${entry.codeLanguage}` : ""}`}
        htmlFor="entry-code-snippet"
        error={fieldErrors.codeSnippet}
      >
        <Textarea
          id="entry-code-snippet"
          value={values.codeSnippet}
          onChange={(event) => setField("codeSnippet", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.codeSnippet}
          className="min-h-24 font-mono text-xs"
        />
      </EditField>

      <EditField label="Tags" htmlFor="entry-tags" error={fieldErrors.tags}>
        <Input
          id="entry-tags"
          value={values.tags}
          onChange={(event) => setField("tags", event.target.value)}
          disabled={isSaving}
          aria-invalid={!!fieldErrors.tags}
          placeholder="hydration, ssr, react"
          className="h-9"
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Tag className="size-3" />
          Separate tags with commas
        </p>
      </EditField>

      {entry.collections.length > 0 && (
        <div className="flex flex-col gap-1.5 border-b border-border px-4 py-4 last:border-b-0">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FolderOpen className="size-3.5" />
            Collections
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {entry.collections.map((collection) => (
              <Badge key={collection.id} variant="secondary">
                {collection.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
