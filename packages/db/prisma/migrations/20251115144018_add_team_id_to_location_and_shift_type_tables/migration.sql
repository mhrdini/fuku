/*
  Warnings:

  - You are about to drop the column `teamId` on the `location` table. All the data in the column will be lost.
  - Added the required column `team_id` to the `location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `team_id` to the `shift_type` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "location" DROP CONSTRAINT "location_teamId_fkey";

-- AlterTable
ALTER TABLE "location" DROP COLUMN "teamId",
ADD COLUMN     "team_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shift_type" ADD COLUMN     "team_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_type" ADD CONSTRAINT "shift_type_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
