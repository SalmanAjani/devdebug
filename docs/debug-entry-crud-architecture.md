# Debug Entry CRUD Architecture

Design for Debug Entry, Collection and Tag CRUD. Extends the patterns already in the
codebase — `requireUserId` scoping, queries in `lib/db`, mutations in `src/actions`, Zod
schemas in `lib/validations` — rather than introducing a second way of doing things.

Companion doc: [debug-entry.md](debug-entry.md) for the content type itself.

---

## Layers

Four layers, each with one job. Nothing skips a layer.

| Layer | Location | Responsibility |
| --- | --- | --- |
| Queries | `src/lib/db/` | Reads. Scoped by `requireUserId()`. Called from server components. |
| Mutations | `src/actions/` | Writes. `"use server"`, Zod-validated, ownership-enforced, revalidate. |
| Routes | `src/app/(dashboard)/` | Server components. Fetch, compose, pass props down. |
| Components | `src/components/` | Render and collect input. No Prisma, no business logic. |

Two rules carry most of the weight:

- **A component never imports `prisma`.** If a component needs data it takes props; if it
  needs to write it calls an action.
- **A query or mutation never takes a `userId` argument.** It calls `requireUserId()`
  itself. An id passed in from a caller is an id that can be wrong.

---

## File structure

```
src/
├── actions/
│   ├── entries.ts              # create, update, delete, pin, view stamping
│   ├── collections.ts          # collection CRUD + entry assignment
│   └── ai.ts                   # AI draft generation — separate from CRUD
├── lib/
│   ├── db/
│   │   ├── entries.ts          # ← exists; add getEntry, filters, pagination
│   │   ├── collections.ts      # ← exists; add getCollections, getCollection
│   │   ├── tags.ts             # tag lookup + resolve-or-create
│   │   └── technologies.ts     # the seeded lookup table
│   ├── validations/
│   │   ├── entry.ts            # entrySchema, entryFiltersSchema
│   │   └── collection.ts       # collectionSchema
│   ├── r2.ts                   # presign only — no Prisma in this file
│   └── openai.ts               # client + structured-output schema
├── app/
│   ├── (dashboard)/
│   │   ├── debug-entries/
│   │   │   ├── page.tsx        # list
│   │   │   ├── new/page.tsx    # create
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # detail
│   │   │       └── edit/page.tsx
│   │   └── collections/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── upload/route.ts     # R2 presigned PUT
│       └── ai/generate/route.ts
└── components/
    ├── entries/
    │   ├── EntryForm.tsx       # shared by create and edit
    │   ├── EntryFormFields.tsx
    │   ├── EntryDetail.tsx
    │   ├── EntryActions.tsx    # pin, edit, delete
    │   ├── TechnologyPicker.tsx
    │   ├── TagInput.tsx
    │   ├── CollectionPicker.tsx
    │   ├── ScreenshotUpload.tsx
    │   ├── CodeBlock.tsx
    │   └── MarkdownContent.tsx
    └── collections/
        ├── CollectionForm.tsx
        └── CollectionCard.tsx
```

---

## Debug Entry CRUD

### Create

`/debug-entries/new` renders `<EntryForm />` with no `entry` prop. Submitting calls
`createEntry`, which:

1. Parses `FormData` with `entrySchema` → on failure returns `fieldErrors`, no write.
2. `requireUserId()` — outside the try, since it redirects by throwing.
3. Resolves tag names to `Tag` rows (`connectOrCreate` on `slug`).
4. Connects technologies by `id`, verified against the seeded table.
5. Creates the entry and its `EntryCollection` joins in one `prisma.$transaction`.
6. `revalidatePath("/debug-entries")`, then `redirect` to the new entry.

Collections named in the payload are verified to belong to the caller before connecting —
otherwise a crafted request could file an entry into someone else's collection.

### Read

Three shapes, three projections. The existing `entryListSelect` already demonstrates why:
lists must not drag long text across the wire.

| Query | Returns | Used by |
| --- | --- | --- |
| `getEntries(filters)` | Trimmed card projection | List grid |
| `getEntry(id)` | Full row + relations | Detail, edit |
| `getRecentlyViewedEntries(limit)` | `id`, `title`, `status`, `viewedAt` | Sidebar list |

`getEntry` filters on `{ id, userId }` — not `findUnique({ where: { id } })` followed by
an ownership check. A non-owned id returns `null` and the page calls `notFound()`, so a
probing request cannot distinguish "someone else's entry" from "does not exist".

### Update

`/debug-entries/[id]/edit` loads via `getEntry(id)`, passes it into the same `<EntryForm />`
as `entry`, and submits to `updateEntry`. Same validation path as create. The write is an
`updateMany({ where: { id, userId } })` — if the row isn't the caller's, it matches zero
rows and the action reports failure rather than succeeding on another user's data.

Relations use `set` rather than `connect`, replacing the lists outright so an edit that
removes a tag actually removes it. Same reasoning as the seed's `set` usage.

### Delete

`deleteEntry(id)` behind an alert dialog, mirroring `DeleteAccountDialog`. Also a
`deleteMany({ where: { id, userId } })`. Join rows in `entry_collections` cascade; global
`Tag` and `Technology` rows are untouched.

### Pin & view stamping

Two narrow actions rather than routing through `updateEntry`:

- `togglePin(id)` — optimistic in the UI, `updateMany` scoped by `userId`.
- `markEntryViewed(id)` — stamps `viewedAt` when the detail view opens. Fire-and-forget:
  it must never block or fail the render.

---

## Routing

### `/debug-entries`

Server component. Reads `searchParams` for `?status=`, `?tech=`, `?collection=`, `?q=`,
`?page=`, validates them with `entryFiltersSchema` (an unparseable filter falls back to the
default rather than throwing), and passes them to `getEntries`.

Filters live in the URL, not in `useState`. That makes a filtered view shareable and
bookmarkable, and it keeps filtering server-side where the indexes are. This replaces the
display-only buttons currently in `EntryToolbar`.

Pagination should move server-side (`skip`/`take`) as part of this work — the current
client-side slice fetches every entry the user owns.

### `/debug-entries/[id]`

Server component: `getEntry(id)` → `notFound()` when null → render `<EntryDetail />`,
and stamp `viewedAt`.

Per the project spec the detail is a **slide-over on desktop, full page on mobile**. Build
the route as a real page first — it's the shareable URL, it works without JS, and it's what
`notFound()` and metadata hang off. Layer the slide-over on top later via an intercepting
route (`@modal/(.)debug-entries/[id]`) so a click from the grid opens the panel while a
direct visit or refresh still renders the page.

---

## Collections and tags

**Collections** are user-owned, so they get the full treatment: `src/lib/db/collections.ts`
for reads, `src/actions/collections.ts` for writes, all scoped by `requireUserId()`.
`@@unique([userId, name])` means a duplicate name is a `P2002` — catch it and return a
field error on `name`, not a generic failure. Deleting a collection removes the join rows,
never the entries inside it.

Entry↔collection assignment lives with collections (`addEntryToCollection`,
`removeEntryFromCollection`) for changes made from the collection side; the entry form
handles its own memberships as part of create/update.

**Tags** are global and have no owner, so they get no CRUD surface of their own. They are
created as a side effect of saving an entry — `resolveTags(names)` in `src/lib/db/tags.ts`
slugifies each name and `connectOrCreate`s on the unique `slug`. There is no "delete tag"
action; removing the last entry using a tag simply leaves an unreferenced row.

**Technologies** are a seeded, read-only lookup table. `getTechnologies()` feeds the picker.
Nothing in the app creates one.

---

## AI operations

AI stays out of the CRUD path entirely.

`POST /api/ai/generate` is a route handler, not a Server Action — it needs specific status
codes (`429` with `Retry-After` for quota and rate limits) and it will stream. It takes
pasted text, calls GPT-5 Nano with a Zod-derived JSON schema, and returns a **draft object**.
It writes nothing to `debug_entries`.

The client drops that draft into the form fields, the user edits, and the ordinary
`createEntry` action saves it. So the AI boundary is clean: AI produces candidate values,
CRUD persists reviewed ones. Quota (`AiUsage`) and rate limiting are checked in the route
before the model call, matching how `src/lib/rate-limit.ts` is used in the auth flows.

---

## Validation

One `entrySchema` in `src/lib/validations/entry.ts` drives three consumers: the form
resolver, the Server Action, and the AI structured output. Required fields mirror the
schema — `title`, `description`, `rootCause`, `solution`, at least one technology.

Client-side validation is UX; the action re-parses everything regardless. Actions return
the established `{ success?, error?, fieldErrors? }` shape that `changePassword` already
uses, so `FormAlert` and the existing field-error rendering work unchanged.

Two schema-specific notes: `codeLanguage` is only meaningful alongside `codeSnippet`
(`superRefine`), and `screenshotUrl` is validated as an R2 URL rather than any URL — an
arbitrary URL in that column would render a remote image inside the app.

---

## Server / client boundaries

Server components by default. `"use client"` only where there's interactivity.

**Server:** all route pages, `EntryDetail`, `MarkdownContent`, the card grid. Markdown
rendering in particular belongs on the server — it keeps the parser out of the bundle.

**Client:** `EntryForm` (`useActionState`), `TagInput`, `TechnologyPicker`,
`CollectionPicker`, `ScreenshotUpload` (needs `File`), `CodeBlock` (copy button, collapse),
`EntryActions`, and the filter toolbar.

Keep the boundary low in the tree. `EntryDetail` stays a server component that renders a
client `CodeBlock` inside it, rather than the whole detail view going client for the sake
of one copy button.

---

## Ownership enforcement

Four rules, applied without exception:

1. **Identity comes from the session.** `requireUserId()` reads it from `auth()`. No action
   accepts a `userId` parameter.
2. **Reads filter by `userId`.** Including single-record reads — `findFirst({ where: { id, userId } })`,
   never `findUnique({ where: { id } })` plus a check afterwards.
3. **Writes scope in the `where`.** `updateMany`/`deleteMany` with `{ id, userId }`. A zero
   match is a failure, never a silent success.
4. **Referenced ids are verified.** Collection ids in an entry payload are checked to belong
   to the caller before connecting.

Server Actions are public HTTP endpoints. A hidden button proves nothing — `changePassword`
already demonstrates the pattern, refusing OAuth-only accounts server-side even though the
UI hides the dialog for them.

---

## Screenshot uploads

R2 operations stay out of `lib/db` and out of the entry actions. `src/lib/r2.ts` only
presigns; it never touches Prisma.

1. Client picks a file, `POST /api/upload` with content type and size.
2. Route authenticates, validates type and size cap, returns a presigned PUT URL and the
   final object key.
3. Browser PUTs the bytes **direct to R2** — never proxied through Next.js.
4. On success the client puts the resulting URL in a hidden form field.
5. `createEntry` / `updateEntry` persist it as an ordinary string column.

The database only ever stores a URL, so an upload that never finishes leaves no broken row
— just an orphaned object, which a lifecycle rule can sweep. Replacing a screenshot leaves
the old object behind; deleting it eagerly would break the entry if the update then failed.
Object keys are prefixed per user (`{userId}/{cuid}.{ext}`), never with the client-supplied
filename.

---

## Build order

1. `getEntry` + `/debug-entries/[id]` detail page + `markEntryViewed`
2. `entrySchema`, `EntryForm`, `createEntry` — `/debug-entries/new`
3. `updateEntry` + edit route (reuses the form), `deleteEntry`, `togglePin`
4. Collections CRUD and entry assignment
5. Server-side filters and pagination on `/debug-entries`
6. Intercepting route for the desktop slide-over
7. R2 upload
8. AI draft route

Detail before create: it's the shortest path to something visible, and the create form is
the largest single piece of UI in the feature.
