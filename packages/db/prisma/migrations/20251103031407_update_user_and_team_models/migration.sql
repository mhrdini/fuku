/*
  Warnings:

  - You are about to drop the column `team_role_id` on the `team_member` table. All the data in the column will be lost.
  - You are about to drop the column `team_member_id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `user_role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_role` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `teamId` on table `team_member` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('ADMIN', 'STAFF');

-- DropForeignKey
ALTER TABLE "public"."team_member" DROP CONSTRAINT "team_member_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_member" DROP CONSTRAINT "team_member_team_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_team_member_id_fkey";

-- DropIndex
DROP INDEX "public"."team_member_team_role_id_idx";

-- DropIndex
DROP INDEX "public"."user_team_member_id_key";

-- AlterTable
ALTER TABLE "team_member" DROP COLUMN "team_role_id",
ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "pay_grade_id" TEXT,
ADD COLUMN     "team_member_role" "TeamMemberRole" NOT NULL DEFAULT 'STAFF',
ADD COLUMN     "user_id" TEXT,
ALTER COLUMN "teamId" SET NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "team_member_id",
DROP COLUMN "user_role";

-- DropTable
DROP TABLE "public"."Team";

-- DropTable
DROP TABLE "public"."team_role";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_rate" DOUBLE PRECISION NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pay_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserTeams" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserTeams_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_name_key" ON "team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pay_grade_teamId_name_key" ON "pay_grade"("teamId", "name");

-- CreateIndex
CREATE INDEX "_UserTeams_B_index" ON "_UserTeams"("B");

-- CreateIndex
CREATE INDEX "team_member_pay_grade_id_idx" ON "team_member"("pay_grade_id");

-- AddForeignKey
ALTER TABLE "pay_grade" ADD CONSTRAINT "pay_grade_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_pay_grade_id_fkey" FOREIGN KEY ("pay_grade_id") REFERENCES "pay_grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserTeams" ADD CONSTRAINT "_UserTeams_A_fkey" FOREIGN KEY ("A") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserTeams" ADD CONSTRAINT "_UserTeams_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
