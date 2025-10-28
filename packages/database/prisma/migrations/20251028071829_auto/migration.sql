/*
  Warnings:

  - You are about to drop the `DayAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeaveAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShiftAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShiftType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamRoleHourlyRate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Unavailability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkHour` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "team_role" AS ENUM ('MANAGER', 'FULL_TIME', 'PART_TIME');

-- DropForeignKey
ALTER TABLE "public"."DayAssignment" DROP CONSTRAINT "DayAssignment_teamMemberId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeaveAssignment" DROP CONSTRAINT "LeaveAssignment_dayAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_dayAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_locationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_shiftTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Unavailability" DROP CONSTRAINT "Unavailability_teamMemberId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkHour" DROP CONSTRAINT "WorkHour_shiftAssignmentId_fkey";

-- DropTable
DROP TABLE "public"."DayAssignment";

-- DropTable
DROP TABLE "public"."LeaveAssignment";

-- DropTable
DROP TABLE "public"."Location";

-- DropTable
DROP TABLE "public"."ShiftAssignment";

-- DropTable
DROP TABLE "public"."ShiftType";

-- DropTable
DROP TABLE "public"."TeamMember";

-- DropTable
DROP TABLE "public"."TeamRoleHourlyRate";

-- DropTable
DROP TABLE "public"."Unavailability";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."WorkHour";

-- DropEnum
DROP TYPE "public"."TeamRole";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_role_hourly_rates" (
    "id" TEXT NOT NULL,
    "role" "team_role" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "team_role_hourly_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "givenNames" TEXT NOT NULL,
    "role" "team_role" NOT NULL,
    "rateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "color" TEXT,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "color" TEXT,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "color" TEXT,

    CONSTRAINT "shift_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_assignment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "day_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignment" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "dayAssignmentId" TEXT NOT NULL,

    CONSTRAINT "shift_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_hour" (
    "id" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "actualStart" TIMESTAMP(3) NOT NULL,
    "actualEnd" TIMESTAMP(3) NOT NULL,
    "rateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "calculatedHours" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "work_hour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_assignment" (
    "id" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "dayAssignmentId" TEXT NOT NULL,

    CONSTRAINT "leave_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unavailability" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "unavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "team_role_hourly_rates_role_key" ON "team_role_hourly_rates"("role");

-- CreateIndex
CREATE UNIQUE INDEX "location_name_key" ON "location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shift_type_name_key" ON "shift_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "day_assignment_teamMemberId_date_key" ON "day_assignment"("teamMemberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignment_dayAssignmentId_key" ON "shift_assignment"("dayAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "work_hour_shiftAssignmentId_key" ON "work_hour"("shiftAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_assignment_dayAssignmentId_key" ON "leave_assignment"("dayAssignmentId");

-- AddForeignKey
ALTER TABLE "day_assignment" ADD CONSTRAINT "day_assignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "shift_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_dayAssignmentId_fkey" FOREIGN KEY ("dayAssignmentId") REFERENCES "day_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_hour" ADD CONSTRAINT "work_hour_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "shift_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_assignment" ADD CONSTRAINT "leave_assignment_dayAssignmentId_fkey" FOREIGN KEY ("dayAssignmentId") REFERENCES "day_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unavailability" ADD CONSTRAINT "unavailability_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
