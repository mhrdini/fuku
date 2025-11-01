/*
  Warnings:

  - You are about to drop the column `session_state` on the `account` table. All the data in the column will be lost.
  - You are about to drop the `TeamRole` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."team_member" DROP CONSTRAINT "team_member_team_role_id_fkey";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "session_state",
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "team_member" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "image" TEXT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "public"."TeamRole";

-- CreateTable
CREATE TABLE "team_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_role_name_key" ON "team_role"("name");

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_role_id_fkey" FOREIGN KEY ("team_role_id") REFERENCES "team_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
