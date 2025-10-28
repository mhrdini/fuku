/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ShiftType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShiftType_name_key" ON "ShiftType"("name");
