-- DropForeignKey
ALTER TABLE "team_member" DROP CONSTRAINT "team_member_pay_grade_id_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastActiveTeamId" TEXT,
ADD COLUMN     "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_lastActiveTeamId_fkey" FOREIGN KEY ("lastActiveTeamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_pay_grade_id_fkey" FOREIGN KEY ("pay_grade_id") REFERENCES "pay_grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
