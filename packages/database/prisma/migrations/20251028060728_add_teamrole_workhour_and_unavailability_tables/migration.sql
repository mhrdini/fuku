/*
  Warnings:

  - You are about to drop the column `leaveType` on the `LeaveAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `ShiftAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `ShiftAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - Added the required column `paid` to the `LeaveAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `TeamMember` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('MANAGER', 'FULL_TIME', 'PART_TIME');

-- AlterTable
ALTER TABLE "LeaveAssignment" DROP COLUMN "leaveType",
ADD COLUMN     "paid" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "ShiftAssignment" DROP COLUMN "endTime",
DROP COLUMN "startTime";

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "type",
ADD COLUMN     "rate" DOUBLE PRECISION,
ADD COLUMN     "role" "TeamRole" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified";

-- DropEnum
DROP TYPE "public"."EmploymentType";

-- DropEnum
DROP TYPE "public"."LeaveType";

-- CreateTable
CREATE TABLE "RoleHourlyRate" (
    "id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoleHourlyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHour" (
    "id" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "actualStart" TIMESTAMP(3) NOT NULL,
    "actualEnd" TIMESTAMP(3) NOT NULL,
    "breakMinutes" INTEGER,
    "calculatedHours" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "WorkHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unavailability" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "Unavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleHourlyRate_role_key" ON "RoleHourlyRate"("role");

-- CreateIndex
CREATE UNIQUE INDEX "WorkHour_shiftAssignmentId_key" ON "WorkHour"("shiftAssignmentId");

-- AddForeignKey
ALTER TABLE "WorkHour" ADD CONSTRAINT "WorkHour_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "ShiftAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unavailability" ADD CONSTRAINT "Unavailability_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
