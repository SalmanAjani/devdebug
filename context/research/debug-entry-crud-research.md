# Debug Entry CRUD Architecture

## Output

`docs/debug-entry-crud-architecture.md`

## Research

Design the CRUD architecture for Debug Entries and their supporting entities:

- Debug Entries
- Collections
- Tags

Use a clean separation between mutations, data fetching, routes, and UI components.

## Include

- File structure for:
  - Server actions / mutations
  - Database queries in `lib/db`
  - Routes
  - Shared UI components
- Debug Entry CRUD operations:
  - Create
  - Read
  - Update
  - Delete
- How `/debug-entries` routing works
- How `/debug-entries/[id]` displays an individual entry
- Where Collection and Tag operations live
- Where AI-related operations live
- Component responsibilities
- Form validation using Zod
- Server/client component boundaries
- How authentication and user ownership are enforced
- How screenshot uploads to Cloudflare R2 are handled

## Architecture Principles

- Keep database queries in `lib/db`
- Keep mutations in server actions
- Keep AI operations separate from standard CRUD operations
- Keep business logic out of UI components
- Reuse components between create and edit forms
- Validate all user input with Zod
- Enforce user ownership at the database/action layer
- Keep Cloudflare R2 operations separate from database operations

## Sources

- @context/project-overview.md
- @docs/debug-entry.md
- @prisma/schema.prisma