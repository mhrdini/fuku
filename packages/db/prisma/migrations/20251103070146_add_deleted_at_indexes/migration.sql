-- CreateIndex
CREATE INDEX "team_deleted_at_idx" ON "team"("deleted_at");

-- CreateIndex
CREATE INDEX "team_member_deleted_at_idx" ON "team_member"("deleted_at");
