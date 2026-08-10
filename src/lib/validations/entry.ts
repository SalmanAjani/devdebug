import { z } from "zod";

import { EntryStatus } from "@/generated/prisma/enums";

/**
 * A body field that may be left blank.
 *
 * The columns behind these are `NOT NULL` in the schema, so "optional" means an
 * empty string rather than a null — the field is trimmed and allowed to be
 * empty, not absent.
 */
const optionalText = z.string().trim().max(20_000, "This field is too long");

/** How many tags one entry may carry. A guard against a pasted wall of commas. */
const MAX_TAGS = 20;

/**
 * The comma-separated tag input, turned into the display names the query layer
 * upserts.
 *
 * Splitting happens here rather than in the component so the server is the one
 * deciding what a tag is — the action is a public endpoint and cannot trust a
 * pre-split array from the client. Blank segments from stray commas are
 * dropped, and duplicates are removed case-insensitively so "React, react"
 * cannot try to connect the same tag twice in one write.
 */
const tagsFromInput = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  )
  .transform((tags) => {
    const seen = new Set<string>();

    return tags.filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })
  .refine((tags) => tags.length <= MAX_TAGS, `Use at most ${MAX_TAGS} tags`)
  .refine(
    (tags) => tags.every((tag) => tag.length <= 50),
    "Each tag must be 50 characters or fewer"
  );

/**
 * What the drawer's edit mode may change.
 *
 * Deliberately narrower than the model: technologies, collections, pins and
 * `viewedAt` are all edited elsewhere, and anything absent from this schema is
 * something the action will not write.
 */
export const updateEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  status: z.enum(EntryStatus),
  description: optionalText,
  errorMessage: optionalText,
  rootCause: optionalText,
  solution: optionalText,
  codeSnippet: optionalText,
  tags: tagsFromInput,
});

/** Post-transform: `tags` is a string[] here, but a string in the form input. */
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

/** Pre-transform — the shape the drawer's controlled inputs actually hold. */
export type UpdateEntryFormValues = z.input<typeof updateEntrySchema>;
