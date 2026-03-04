/*
 Warnings:
 
 - Added the required column `target` to the `rule` table without a default value. This is not possible if the table is not empty.
 - Added the required column `team_id` to the `rule` table without a default value. This is not possible if the table is not empty.
 
 */
-- CreateEnum
CREATE TYPE "RuleTarget" AS ENUM (
  'PAY_GRADE',
  'SHIFT_TYPE',
  'TEAM_MEMBER',
  'GLOBAL'
);
-- AlterTable
ALTER TABLE "rule"
ADD COLUMN "shift_type_id" TEXT,
  ADD COLUMN "target" "RuleTarget" NOT NULL,
  ADD COLUMN "team_id" TEXT NOT NULL,
  ADD COLUMN "team_member_id" TEXT,
  ALTER COLUMN "pay_grade_id" DROP NOT NULL;
-- CreateIndex
CREATE INDEX "rule_team_id_idx" ON "rule"("team_id");
-- CreateIndex
CREATE INDEX "rule_shift_type_id_idx" ON "rule"("shift_type_id");
-- CreateIndex
CREATE INDEX "rule_team_member_id_idx" ON "rule"("team_member_id");
-- AddForeignKey
ALTER TABLE "rule"
ADD CONSTRAINT "rule_shift_type_id_fkey" FOREIGN KEY ("shift_type_id") REFERENCES "shift_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "rule"
ADD CONSTRAINT "rule_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddCheckConstraint
ALTER TABLE "rule"
ADD CONSTRAINT single_target CHECK (
    (
      target = 'PAY_GRADE'
      AND pay_grade_id IS NOT NULL
      AND shift_type_id IS NULL
      AND team_member_id IS NULL
    )
    OR (
      target = 'SHIFT_TYPE'
      AND shift_type_id IS NOT NULL
      AND pay_grade_id IS NULL
      AND team_member_id IS NULL
    )
    OR (
      target = 'TEAM_MEMBER'
      AND team_member_id IS NOT NULL
      AND pay_grade_id IS NULL
      AND shift_type_id IS NULL
    )
    OR (
      target = 'GLOBAL'
      AND pay_grade_id IS NULL
      AND shift_type_id IS NULL
      AND team_member_id IS NULL
    )
  );