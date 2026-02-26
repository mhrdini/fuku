/*
  Warnings:

  - You are about to drop the `Rule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rule" DROP CONSTRAINT "Rule_pay_grade_id_fkey";

-- DropTable
DROP TABLE "Rule";

-- CreateTable
CREATE TABLE "rule" (
    "id" TEXT NOT NULL,
    "pay_grade_id" TEXT NOT NULL,
    "metric" "Metric" NOT NULL,
    "time_window" "TimeWindow" NOT NULL,
    "operator" "Operator" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "hard_constraint" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rule_pay_grade_id_idx" ON "rule"("pay_grade_id");

-- AddForeignKey
ALTER TABLE "rule" ADD CONSTRAINT "rule_pay_grade_id_fkey" FOREIGN KEY ("pay_grade_id") REFERENCES "pay_grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
