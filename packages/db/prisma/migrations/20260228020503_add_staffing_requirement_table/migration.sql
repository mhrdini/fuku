-- CreateTable
CREATE TABLE "staffing_requirement" (
    "day_of_week" INTEGER NOT NULL,
    "team_id" TEXT NOT NULL,
    "min_members" INTEGER NOT NULL DEFAULT 1,
    "max_members" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staffing_requirement_pkey" PRIMARY KEY ("team_id","day_of_week")
);

-- CreateIndex
CREATE INDEX "staffing_requirement_team_id_idx" ON "staffing_requirement"("team_id");

-- CreateIndex
CREATE INDEX "staffing_requirement_day_of_week_idx" ON "staffing_requirement"("day_of_week");

-- AddForeignKey
ALTER TABLE "staffing_requirement" ADD CONSTRAINT "staffing_requirement_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
