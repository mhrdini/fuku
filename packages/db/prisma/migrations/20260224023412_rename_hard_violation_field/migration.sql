/*
  Warnings:

  - You are about to drop the column `hard_violation` on the `Rule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rule" DROP COLUMN "hard_violation",
ADD COLUMN     "hard_constraint" BOOLEAN NOT NULL DEFAULT false;
