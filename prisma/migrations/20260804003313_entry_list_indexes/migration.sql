-- DropIndex
DROP INDEX "collections_userId_idx";

-- DropIndex
DROP INDEX "debug_entries_userId_isPinned_idx";

-- CreateIndex
CREATE INDEX "debug_entries_userId_isPinned_createdAt_idx" ON "debug_entries"("userId", "isPinned" DESC, "createdAt" DESC);
