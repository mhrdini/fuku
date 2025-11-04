/*
  Warnings:

  - You are about to drop the column `createdAt` on the `pay_grade` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `pay_grade` table. All the data in the column will be lost.
  - You are about to drop the column `archived_at` on the `team` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `team` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `team` table. All the data in the column will be lost.
  - You are about to drop the column `archived_at` on the `team_member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pay_grade" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "team" DROP COLUMN "archived_at",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "team_member" DROP COLUMN "archived_at",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" TEXT;
