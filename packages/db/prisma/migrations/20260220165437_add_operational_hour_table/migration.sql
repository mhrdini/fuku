-- CreateTable
CREATE TABLE "operational_hour" (
    "id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" TEXT,

    CONSTRAINT "operational_hour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operational_hour_team_id_idx" ON "operational_hour"("team_id");

-- CreateIndex
CREATE INDEX "operational_hour_day_of_week_idx" ON "operational_hour"("day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "operational_hour_team_id_day_of_week_key" ON "operational_hour"("team_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "operational_hour" ADD CONSTRAINT "operational_hour_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
