/*
  Warnings:

  - You are about to drop the `holiday` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "holiday" DROP CONSTRAINT "holiday_team_id_fkey";

-- DropTable
DROP TABLE "holiday";
