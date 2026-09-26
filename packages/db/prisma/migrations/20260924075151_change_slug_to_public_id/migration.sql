/*
  Warnings:

  - You are about to drop the column `slug` on the `team` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[public_id]` on the table `team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `public_id` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "team_slug_key";

-- AlterTable
ALTER TABLE "team" DROP COLUMN "slug",
ADD COLUMN     "public_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "team_public_id_key" ON "team"("public_id");
