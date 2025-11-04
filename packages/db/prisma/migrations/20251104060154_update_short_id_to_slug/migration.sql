/*
  Warnings:

  - You are about to drop the column `short_id` on the `team` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."team_short_id_key";

-- AlterTable
ALTER TABLE "team" DROP COLUMN "short_id",
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "team_slug_key" ON "team"("slug");
