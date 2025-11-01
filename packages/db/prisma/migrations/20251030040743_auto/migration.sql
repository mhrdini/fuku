/*
  Warnings:

  - You are about to drop the column `teamRoleId` on the `team_member` table. All the data in the column will be lost.
  - Added the required column `team_role_id` to the `team_member` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."team_member" DROP CONSTRAINT "team_member_teamRoleId_fkey";

-- AlterTable
ALTER TABLE "team_member" DROP COLUMN "teamRoleId",
ADD COLUMN     "team_role_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_role_id_fkey" FOREIGN KEY ("team_role_id") REFERENCES "TeamRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
