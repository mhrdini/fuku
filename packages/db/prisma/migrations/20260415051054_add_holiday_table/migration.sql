-- CreateTable
CREATE TABLE "holiday" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "holiday_team_id_idx" ON "holiday"("team_id");

-- CreateIndex
CREATE INDEX "holiday_date_idx" ON "holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_team_id_date_key" ON "holiday"("team_id", "date");

-- AddForeignKey
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
