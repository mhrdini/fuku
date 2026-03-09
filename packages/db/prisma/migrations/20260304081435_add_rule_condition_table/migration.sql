/*
  Warnings:

  - Changed the type of `operator` on the `rule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('MIN', 'MAX');

-- CreateEnum
CREATE TYPE "ConditionField" AS ENUM ('MONTH', 'WEEKDAY');

-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('EQ', 'NEQ', 'IN', 'NOT_IN', 'GTE', 'LTE');

-- AlterTable
ALTER TABLE "rule" DROP COLUMN "operator",
ADD COLUMN     "operator" "RuleOperator" NOT NULL;

-- DropEnum
DROP TYPE "Operator";

-- CreateTable
CREATE TABLE "rule_condition" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "field" "ConditionField" NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "rule_condition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rule_condition_rule_id_idx" ON "rule_condition"("rule_id");

-- AddForeignKey
ALTER TABLE "rule_condition" ADD CONSTRAINT "rule_condition_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
