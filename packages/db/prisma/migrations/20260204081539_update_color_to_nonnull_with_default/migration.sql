/*
  Warnings:

  - Made the column `color` on table `location` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `shift_type` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `team_member` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "location" ALTER COLUMN "color" SET NOT NULL;

-- AlterTable
ALTER TABLE "shift_type" ALTER COLUMN "color" SET NOT NULL;

-- AlterTable
ALTER TABLE "team_member" ALTER COLUMN "color" SET NOT NULL;
