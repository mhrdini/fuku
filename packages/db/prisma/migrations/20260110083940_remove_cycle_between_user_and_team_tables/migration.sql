/*
  Warnings:

  - You are about to drop the column `teamId` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_teamId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "teamId";
