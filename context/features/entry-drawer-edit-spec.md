# Entry Drawer — Edit Mode

## Overview

Clicking the Edit button (pencil icon) in the entry drawer's action bar switches from view mode to edit mode inline. The same drawer stays open — fields become editable inputs.

## Requirements

### Mode Toggle

- Edit button toggles the drawer into edit mode
- In edit mode, the action bar is replaced with Save and Cancel buttons
- Cancel discards changes and returns to view mode
- Save persists changes via server action, returns to view mode, and refreshes the drawer data
- Notification on save success or error

### Editable Fields

All types:

- **Title** — text input, required
- **Status** — toggle, required
- **Description** — textarea, optional
- **Error Message** — textarea, optional
- **Root Cause** — textarea, optional
- **Solution** — textarea, optional
- **Code Snippet** — textarea, optional
- **Tags** — comma-separated text input that converts to tag array on save


### Non-Editable (display only in edit mode)

- Collections — will be managed separately

## Validation

Use Zod for validation. Validate in the server action before hitting the database.

Return Zod errors in the `{ success: false, error }` response so the client can display them.

## Server Action

`updateEntry(entryId, data)` in `src/actions/entries.ts` following the `{ success, data, error }` return pattern. Validates input with Zod, gets session via `auth()`, validates ownership, calls query function.

## Data

- Query function in `lib/db/entries.ts` — `updateEntry`
- Tag handling on update: disconnect all existing tags, connect-or-create new ones
- Returns updated `EntryDetail` so the drawer can refresh without a second fetch

## Notes

- Keep it simple — no form library needed, use controlled inputs with local state
- Client-side: disable Save button when title is empty (basic UX guard)
- Server-side: Zod validates all fields in the server action (source of truth)
- After save, call `router.refresh()` so the underlying card list reflects changes
