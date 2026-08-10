# Debug Entry Drawer

## Overview

Right-side slide-in drawer that opens when clicking a debug entry card. This is the debug entry detail view — there is no separate page.

## Requirements

- Use shadcn Sheet component, opens from the right
- Clicking a Card opens the drawer with that entry's full data
- Works on dashboard, collections and pinned pages
- Action bar Pin, Copy, Edit (pencil icon), and Delete (trash icon, right-aligned) — see screenshot for layout
- Client wrapper component to manage drawer state since pages are server components
- Should feel snappy — fetch on click, no page navigation

## Data Fetching

- Card data (title, description, tags, etc.) is fetched by the server component as before
- Full entry detail (description, error message, root cause, etc.) is fetched on click via API route (`/api/entries/[id]`)
- Query function lives in `lib/db/entries.ts`, API route calls it with auth check
- Drawer shows a skeleton/loading state while fetching

## Reference

See `context/screenshots/dashboard-ui-drawer.png` for the visual design.
