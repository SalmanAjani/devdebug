# Dashboard Entries Spec

## Overview

Replace the dummy entries data displayed in the main area of the dashboard (right side), with actual data from the database. It should look how it does now with the 6 cards, but instead of using data from @src/lib/mock-data.ts, it should be from our Neon database using Prisma.

Do not add recently viewed yet. We will do that later.

## Requirements

- Create src/lib/db/entries.ts with data fetching functions
- Fetch entries directly in server component

## References

Check the `@context/screenshots/dashboard-ui-main.png` screenshot if needed, but layout and design is already there.
