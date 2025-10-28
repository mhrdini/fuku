/*
  Warnings:

  - You are about to drop the column `rate` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `WorkHour` table. All the data in the column will be lost.
  - You are about to drop the `RoleHourlyRate` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `breakMinutes` on table `WorkHour` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "rate",
ADD COLUMN     "rateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "WorkHour" DROP COLUMN "notes",
ADD COLUMN     "rateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ALTER COLUMN "breakMinutes" SET NOT NULL,
ALTER COLUMN "breakMinutes" SET DEFAULT 60,
ALTER COLUMN "calculatedHours" SET DEFAULT 0;

-- DropTable
DROP TABLE "public"."RoleHourlyRate";

-- CreateTable
CREATE TABLE "TeamRoleHourlyRate" (
    "id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TeamRoleHourlyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamRoleHourlyRate_role_key" ON "TeamRoleHourlyRate"("role");
