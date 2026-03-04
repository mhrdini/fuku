-- AlterTable
ALTER TABLE "rule" ADD COLUMN     "penalty" INTEGER DEFAULT 1,
ALTER COLUMN "target" SET DEFAULT 'GLOBAL';

-- AlterTable
ALTER TABLE "shift_type" ADD COLUMN     "allowed_weekdays" INTEGER[];

-- AddForeignKey
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
