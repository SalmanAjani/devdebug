# Debug Entry

The core content type in DevDebug. One Debug Entry = one bug encountered and resolved,
capturing what broke, why it broke, and what fixed it.

Model: `DebugEntry` → table `debug_entries` ([prisma/schema.prisma:106](../prisma/schema.prisma#L106))

---

## Purpose

Debugging knowledge normally scatters across AI chats, terminal history, Slack threads and
thin commit messages. A Debug Entry is the single durable record for one bug: root cause,
solution, the code involved, and the tags needed to find it again months later.

Every entry belongs to exactly one user. Reads and writes are scoped by the session
user's `id` — an entry is never shared or globally visible in v1.

---

## Fields

### Identity & content

| Field | Type | Required | Purpose |
| --- | --- | :---: | --- |
| `id` | `String` (cuid) | auto | Primary key |
| `title` | `String` | ✅ | Short, searchable summary — the card headline |
| `description` | `Text` | ✅ | What happened vs. what was expected |
| `errorMessage` | `Text?` | ❌ | Raw error or stack trace, verbatim |
| `rootCause` | `Text` | ✅ | Why it actually broke |
| `solution` | `Text` | ✅ | What fixed it |

`rootCause` and `solution` are required even when the bug is still `OPEN`. The seed data
shows the convention: an open entry fills them with the current hypothesis and progress
("Still investigating — normalising both values to milliseconds fixes it locally but
staging still logs users out"), not an empty string.

### Classification

| Field | Type | Required | Purpose |
| --- | --- | :---: | --- |
| `status` | `EntryStatus` | ✅ (defaults `OPEN`) | Open / Resolved |
| `technologies` | `Technology[]` | ✅ | Colour-coded badges, many-to-many |
| `tags` | `Tag[]` | ❌ | Free-form labels, many-to-many |
| `collections` | `EntryCollection[]` | ❌ | User's folders, many-to-many |

### Attachments

| Field | Type | Required | Purpose |
| --- | --- | :---: | --- |
| `codeSnippet` | `Text?` | ❌ | The code involved |
| `codeLanguage` | `String?` | ❌ | Syntax-highlighting hint (`ts`, `tsx`, `dockerfile`) |
| `screenshotUrl` | `String?` | ❌ | Cloudflare R2 object URL |

### State & timestamps

| Field | Type | Required | Purpose |
| --- | --- | :---: | --- |
| `isPinned` | `Boolean` | auto (`false`) | Pins the entry to the top of the grid |
| `viewedAt` | `DateTime?` | ❌ | Last opened — powers "Recently Viewed" |
| `createdAt` | `DateTime` | auto | Insert time |
| `updatedAt` | `DateTime` | auto | Last write |
| `userId` | `String` | ✅ | Owner, `onDelete: Cascade` |

**Required, at a glance:** `title`, `description`, `rootCause`, `solution`, `status`,
at least one technology, `userId`. Everything else is optional.

---

## Status

`EntryStatus` is a two-value enum. There is no in-between state.

| Value | Label | Icon | Token | Meaning |
| --- | --- | --- | --- | --- |
| `OPEN` | Open | `CircleDot` | `--color-status-open` `#f59e0b` | Still under investigation |
| `RESOLVED` | Resolved | `CircleCheck` | `--color-status-resolved` `#22c55e` | Root cause found and fixed |

Labels, icons and classes live in one place — `STATUS_CONFIG` in
[src/lib/constants/entry.ts:13](../src/lib/constants/entry.ts#L13). Class names are
written out in full because Tailwind scans source as plain text and never sees classes
built by concatenation.

---

## Technologies vs. tags

Both are many-to-many with entries, both global tables keyed by a unique `slug`, and both
de-duplicate across users. They differ in what they're for.

**`Technology`** — a curated lookup table seeded by
[prisma/seed.ts:32](../prisma/seed.ts#L32) (18 rows: React, Next.js, Prisma, Docker,
OpenAI…). It carries a `category` (`TechCategory`) that drives badge colour:

| Category | Token | Colour |
| --- | --- | --- |
| `FRONTEND` | `--color-tech-frontend` | `#06b6d4` cyan |
| `BACKEND` | `--color-tech-backend` | `#8b5cf6` violet |
| `DATABASE` | `--color-tech-database` | `#3b82f6` blue |
| `DEVOPS` | `--color-tech-devops` | `#ef4444` red |
| `AI` | `--color-tech-ai` | `#14b8a6` teal |
| `OTHER` | `--color-tech-other` | `#6b7280` grey (default) |

Mapping: `TECH_CATEGORY_CLASS` in
[src/lib/constants/entry.ts:28](../src/lib/constants/entry.ts#L28).

**`Tag`** — free-form, uncoloured, user-created (`hydration`, `n-plus-1`, `deadlock`).
Rendered monospace as `#{slug}`, not by display `name`.

Both use `slug` as the unique key rather than a compound key, because upserting on a
compound key containing a nullable column silently fails in Postgres — `NULL` never
equals `NULL` in a unique index.

---

## Content shapes

An entry mixes three kinds of content, each handled differently.

**Text** — `description`, `rootCause`, `solution` are markdown, authored in the markdown
editor and rendered as markdown in the detail view. `errorMessage` is *not* markdown: it
is raw output, rendered monospace and preserved verbatim. All four are `@db.Text`, so
there is no practical length ceiling.

**Code** — `codeSnippet` plus `codeLanguage` travel together. A snippet without a
language falls back to plain rendering; a language without a snippet is meaningless. The
seed uses `ts`, `tsx`, `dockerfile`. Detail view gets syntax highlighting, a copy button,
and collapses long snippets by default.

**Image** — `screenshotUrl` holds a Cloudflare R2 object URL. The browser uploads direct
via a presigned PUT; image bytes never proxy through Next.js. One screenshot per entry.

---

## Relationships

```
User 1──∞ DebugEntry ∞──∞ Technology
                     ∞──∞ Tag
                     ∞──∞ Collection   (via EntryCollection)
```

- **User** — one owner per entry, `onDelete: Cascade`. Deleting a user deletes their entries.
- **Technology / Tag** — implicit many-to-many join tables (`EntryTechnologies`, `EntryTags`).
  These rows are global; deleting an entry only drops the link.
- **Collection** — explicit join model `EntryCollection`, composite PK `[entryId, collectionId]`,
  carrying `addedAt` so entries can be sorted by when they joined a collection. Cascades from
  both sides. An entry may belong to zero, one, or many collections.

---

## Pinning (and the absence of favorites)

`isPinned` is the only user-controlled prominence flag. **Favorites do not exist** — they
were dropped early in favour of pinned alone ("Remove Favorites" in the feature history).
There is no `isFavorite` column, no favourites route, no favourites nav item. Anything
referring to favourites is stale.

Pinned behaviour:

- Sorts pinned entries above the rest, newest-first within each group:
  `orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]`
- Backed by `@@index([userId, isPinned(sort: Desc), createdAt(sort: Desc)])`, which also
  serves pinned-only lookups on its leading columns — no separate `isPinned` index needed.
- Surfaces as a `Pin` icon in the card's top-right and a count in the sidebar.
- Has its own route, `/pinned`.

---

## Display

### List / grid view

Cards render from a deliberately trimmed projection —
`entryListSelect` in [src/lib/db/entries.ts:11](../src/lib/db/entries.ts#L11) — which
pulls only `id`, `title`, `description`, `errorMessage`, `status`, `isPinned`, plus the
technology and tag relations. Long text (`rootCause`, `solution`, `codeSnippet`) is never
fetched for a list. `createdAt` is omitted too: cards show no date, and ordering by a
column doesn't require selecting it.

Card layout ([EntryCard.tsx](../src/components/entries/EntryCard.tsx)):

1. Status badge, and a pin icon when pinned
2. Title (wraps)
3. Description, clamped to two lines
4. Error message, single truncated monospace line — omitted when null
5. Technology badges then tag chips, pushed to the bottom

Grid is 1 / 2 / 3 columns at mobile / `md` / `xl`, paginated at
`ENTRIES_PAGE_SIZE = 6`. Pagination is currently client-side over the full fetched list.

### Recently Viewed

An even narrower projection — `id`, `title`, `status`, `viewedAt` — ordered by `viewedAt`
desc, `take: RECENTLY_VIEWED_LIMIT` (5), excluding entries never opened. One line each:
status badge, truncated title, date. The whole section hides when empty.

### Detail view

Slide-over panel on desktop (keeps list context), full page on mobile. Shows every field:
markdown-rendered description / root cause / solution, verbatim error block,
highlighted code with copy button, screenshot, collections, and both badge sets. Opening
an entry stamps `viewedAt`.

---

## Search & filtering

**Search** spans title, description, error message, root cause, solution, technologies and
tags. The intended implementation is a Postgres `tsvector` generated column with a GIN
index — `ILIKE '%x%'` degrades past roughly 5k rows.

**Filters** are status, technology, and collection. The toolbar renders all three as
display-only buttons today ([EntryToolbar.tsx:26](../src/components/entries/EntryToolbar.tsx#L26)),
alongside a grid/list view toggle that is likewise not yet wired.

Indexes supporting these access paths, all leading with `userId`:

| Index | Serves |
| --- | --- |
| `[userId, createdAt desc]` | Default newest-first listing |
| `[userId, status]` | Status filter |
| `[userId, isPinned desc, createdAt desc]` | Pinned-first grid, and `/pinned` |
| `[userId, viewedAt desc]` | Recently Viewed |

---

## AI-generated fields

AI never writes directly to an entry. Pasting an error, a stack trace, or an AI chat log
sends it to GPT-5 Nano with a Zod-derived JSON schema; the structured output becomes an
**editable draft** — title, summary, root cause, solution, tags. The user reviews and
edits before anything is saved.

The result is that no column is "the AI column". `rootCause` holds the same kind of value
whether a human typed it or accepted an AI draft, so entries stay uniform for search,
display and export.

Gating (development builds leave everything open):

| Feature | Free | Pro |
| --- | --- | --- |
| AI bug summary | 20 / month | Unlimited |
| AI root cause | ❌ | ✅ |
| AI solution | ❌ | ✅ |
| AI auto-tagging | ❌ | ✅ |
| AI explain error | ❌ | ✅ |

The free-tier counter is the `AiUsage` model, one row per user per `"YYYY-MM"` period.
Limits are enforced server-side in the route handler before the write; client-side gating
is UI polish, not security.

---

## Current state

Implemented: schema and migrations, seed data (9 entries), the scoped list and
recently-viewed queries, card grid with client-side pagination, status and technology
badges, pinned sort and counts.

Not yet built: entry CRUD (create / edit / delete), the detail slide-over, `viewedAt`
stamping, markdown rendering, syntax highlighting, screenshot upload, full-text search,
the filter dropdowns, the list-view toggle, and every AI field.
