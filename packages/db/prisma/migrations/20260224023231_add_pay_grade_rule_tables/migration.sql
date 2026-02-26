-- CreateEnum
CREATE TYPE "Metric" AS ENUM ('DAYS_WORKED', 'HOURS_WORKED', 'DAYS_OFF', 'CONSECUTIVE_DAYS_WORKED');

-- CreateEnum
CREATE TYPE "TimeWindow" AS ENUM ('DAY', 'WEEK', 'MONTH', 'ROLLING_WEEK', 'ROLLING_MONTH');

-- CreateEnum
CREATE TYPE "Operator" AS ENUM ('MIN', 'MAX');

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "pay_grade_id" TEXT NOT NULL,
    "metric" "Metric" NOT NULL,
    "time_window" "TimeWindow" NOT NULL,
    "operator" "Operator" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "hard_violation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_pay_grade_id_fkey" FOREIGN KEY ("pay_grade_id") REFERENCES "pay_grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
