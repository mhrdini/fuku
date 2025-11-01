/*
  Warnings:

  - A unique constraint covering the columns `[team_member_id,date]` on the table `unavailability` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "day_assignment_date_idx" ON "day_assignment"("date");

-- CreateIndex
CREATE INDEX "shift_assignment_location_id_idx" ON "shift_assignment"("location_id");

-- CreateIndex
CREATE INDEX "shift_assignment_shift_type_id_idx" ON "shift_assignment"("shift_type_id");

-- CreateIndex
CREATE INDEX "shift_assignment_location_id_shift_type_id_idx" ON "shift_assignment"("location_id", "shift_type_id");

-- CreateIndex
CREATE INDEX "team_member_team_role_id_idx" ON "team_member"("team_role_id");

-- CreateIndex
CREATE INDEX "unavailability_team_member_id_idx" ON "unavailability"("team_member_id");

-- CreateIndex
CREATE INDEX "unavailability_date_idx" ON "unavailability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "unavailability_team_member_id_date_key" ON "unavailability"("team_member_id", "date");
