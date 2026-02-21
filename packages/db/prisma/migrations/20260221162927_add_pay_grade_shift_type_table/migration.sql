/*
  Warnings:

  - The primary key for the `operational_hour` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `operational_hour` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "operational_hour_team_id_day_of_week_key";

-- AlterTable
ALTER TABLE "operational_hour" DROP CONSTRAINT "operational_hour_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "operational_hour_pkey" PRIMARY KEY ("team_id", "day_of_week");

-- CreateTable
CREATE TABLE "pay_grade_shift_type" (
    "pay_grade_id" TEXT NOT NULL,
    "shift_type_id" TEXT NOT NULL,

    CONSTRAINT "pay_grade_shift_type_pkey" PRIMARY KEY ("pay_grade_id","shift_type_id")
);

-- CreateIndex
CREATE INDEX "pay_grade_shift_type_pay_grade_id_idx" ON "pay_grade_shift_type"("pay_grade_id");

-- CreateIndex
CREATE INDEX "pay_grade_shift_type_shift_type_id_idx" ON "pay_grade_shift_type"("shift_type_id");

-- AddForeignKey
ALTER TABLE "pay_grade_shift_type" ADD CONSTRAINT "pay_grade_shift_type_pay_grade_id_fkey" FOREIGN KEY ("pay_grade_id") REFERENCES "pay_grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_grade_shift_type" ADD CONSTRAINT "pay_grade_shift_type_shift_type_id_fkey" FOREIGN KEY ("shift_type_id") REFERENCES "shift_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
