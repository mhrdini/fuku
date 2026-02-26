/*
  Warnings:

  - You are about to drop the column `teamId` on the `pay_grade` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `team_member` table. All the data in the column will be lost.
  - You are about to drop the column `lastActiveTeamId` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[team_id,name]` on the table `pay_grade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `team_id` to the `pay_grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `team_id` to the `team_member` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pay_grade" DROP CONSTRAINT "pay_grade_teamId_fkey";

-- DropForeignKey
ALTER TABLE "team_member" DROP CONSTRAINT "team_member_teamId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_lastActiveTeamId_fkey";

-- DropIndex
DROP INDEX "pay_grade_teamId_name_key";

-- DropIndex
DROP INDEX "team_member_teamId_idx";

-- AlterTable
ALTER TABLE "pay_grade" DROP COLUMN "teamId",
ADD COLUMN     "team_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "team_member" DROP COLUMN "teamId",
ADD COLUMN     "team_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "lastActiveTeamId",
ADD COLUMN     "last_active_team_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pay_grade_team_id_name_key" ON "pay_grade"("team_id", "name");

-- CreateIndex
CREATE INDEX "team_member_team_id_idx" ON "team_member"("team_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_last_active_team_id_fkey" FOREIGN KEY ("last_active_team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_grade" ADD CONSTRAINT "pay_grade_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
