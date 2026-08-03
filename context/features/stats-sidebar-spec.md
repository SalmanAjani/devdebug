# Stats & Sidebar Spec

## Overview

Show the item count for all debug entries, collections and pinned entries in the sidebar. Get the data from the database instead of @src/lib/mock-data.ts file.

## Requirements

- Might need to create @src/lib/db/collections.ts for collections similar to @src/lib/db/entries.ts
- Display stats pertaining to database data, keeping the current design/layout
- Show item count for all debug entries, collections, pinned entries on the right side of the link (inside the sidebar).


## References

-  @src/lib/db/entries.ts