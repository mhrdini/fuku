-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('PAID', 'UNPAID');

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "color" TEXT,
    "familyName" TEXT NOT NULL,
    "givenNames" TEXT NOT NULL,
    "type" "EmploymentType" NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "color" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftType" (
    "id" TEXT NOT NULL,
    "color" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayAssignment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "DayAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "dayAssignmentId" TEXT NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveAssignment" (
    "id" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "dayAssignmentId" TEXT NOT NULL,

    CONSTRAINT "LeaveAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DayAssignment_teamMemberId_date_key" ON "DayAssignment"("teamMemberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_dayAssignmentId_key" ON "ShiftAssignment"("dayAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveAssignment_dayAssignmentId_key" ON "LeaveAssignment"("dayAssignmentId");

-- AddForeignKey
ALTER TABLE "DayAssignment" ADD CONSTRAINT "DayAssignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "ShiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_dayAssignmentId_fkey" FOREIGN KEY ("dayAssignmentId") REFERENCES "DayAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAssignment" ADD CONSTRAINT "LeaveAssignment_dayAssignmentId_fkey" FOREIGN KEY ("dayAssignmentId") REFERENCES "DayAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
