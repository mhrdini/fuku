/*
 Warnings:
 
 - You are about to drop the `day_assignment` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `leave_assignment` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `location` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `shift_assignment` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `shift_type` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `team_member` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `team_role_hourly_rates` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `unavailability` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
 - You are about to drop the `work_hour` table. If the table is not empty, all the data it contains will be lost.
 
 */
-- DropForeignKey
ALTER TABLE "public"."day_assignment" DROP CONSTRAINT "day_assignment_teamMemberId_fkey";
-- DropForeignKey
ALTER TABLE "public"."leave_assignment" DROP CONSTRAINT "leave_assignment_dayAssignmentId_fkey";
-- DropForeignKey
ALTER TABLE "public"."shift_assignment" DROP CONSTRAINT "shift_assignment_dayAssignmentId_fkey";
-- DropForeignKey
ALTER TABLE "public"."shift_assignment" DROP CONSTRAINT "shift_assignment_locationId_fkey";
-- DropForeignKey
ALTER TABLE "public"."shift_assignment" DROP CONSTRAINT "shift_assignment_shiftTypeId_fkey";
-- DropForeignKey
ALTER TABLE "public"."unavailability" DROP CONSTRAINT "unavailability_teamMemberId_fkey";
-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_teamMemberId_fkey";
-- DropForeignKey
ALTER TABLE "public"."work_hour" DROP CONSTRAINT "work_hour_shiftAssignmentId_fkey";
-- DropTable
DROP TABLE "public"."day_assignment";
-- DropTable
DROP TABLE "public"."leave_assignment";
-- DropTable
DROP TABLE "public"."location";
-- DropTable
DROP TABLE "public"."shift_assignment";
-- DropTable
DROP TABLE "public"."shift_type";
-- DropTable
DROP TABLE "public"."team_member";
-- DropTable
DROP TABLE "public"."team_role_hourly_rates";
-- DropTable
DROP TABLE "public"."unavailability";
-- DropTable
DROP TABLE "public"."user";
-- DropTable
DROP TABLE "public"."work_hour";
-- DropEnum
DROP TYPE "public"."UserRole";
-- DropEnum
DROP TYPE "public"."team_role";