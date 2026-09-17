/*
  Warnings:

  - You are about to drop the column `target` on the `rule` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RuleScope" AS ENUM ('PAY_GRADE', 'SHIFT_TYPE', 'TEAM_MEMBER', 'GLOBAL');

-- AlterTable
ALTER TABLE "rule" DROP COLUMN "target",
ADD COLUMN     "scope" "RuleScope" NOT NULL DEFAULT 'GLOBAL';

-- DropEnum
DROP TYPE "RuleTarget";
