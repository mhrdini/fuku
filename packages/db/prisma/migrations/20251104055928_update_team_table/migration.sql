/*
  Warnings:

  - A unique constraint covering the columns `[short_id]` on the table `team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `short_id` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "team" ADD COLUMN     "short_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "team_short_id_key" ON "team"("short_id");
