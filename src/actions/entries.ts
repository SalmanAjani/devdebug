"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateEntry as updateEntryQuery, type EntryDetail } from "@/lib/db/entries";
import {
  updateEntrySchema,
  type UpdateEntryFormValues,
} from "@/lib/validations/entry";

/** The `{ success, data, error }` shape every action in this file returns. */
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      /** Present only when validation is what failed. */
      fieldErrors?: Record<string, string[] | undefined>;
    };

/**
 * Applies the drawer's edit to one entry.
 *
 * Takes the raw form values rather than a parsed payload: a Server Action is a
 * public endpoint, so the client's copy of the schema is a UX convenience and
 * this parse is the one that counts. Ownership is checked in the query, which
 * scopes the write by the session user's id.
 */
export async function updateEntry(
  entryId: string,
  values: UpdateEntryFormValues
): Promise<ActionResult<EntryDetail>> {
  const parsed = updateEntrySchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const entry = await updateEntryQuery(entryId, parsed.data);

    // Null means the id is not the caller's — reported as missing rather than
    // forbidden, so the response does not confirm that the entry exists.
    if (!entry) {
      return { success: false, error: "That entry could not be found." };
    }

    // The card grid, the sidebar counts and the pinned list all read this entry.
    revalidatePath("/dashboard", "layout");

    return { success: true, data: entry };
  } catch (error) {
    console.error("Updating entry failed", entryId, error);
    return { success: false, error: "Could not save your changes. Please try again." };
  }
}
