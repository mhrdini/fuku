/*
  Warnings:

  - The values [DAY,WEEK,MONTH,ROLLING_WEEK,ROLLING_MONTH] on the enum `TimeWindow` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TimeWindow_new" AS ENUM ('PER_DAY', 'PER_WEEK', 'PER_MONTH', 'PER_ROLLING_WEEK', 'PER_ROLLING_MONTH');
ALTER TABLE "rule" ALTER COLUMN "time_window" TYPE "TimeWindow_new" USING ("time_window"::text::"TimeWindow_new");
ALTER TYPE "TimeWindow" RENAME TO "TimeWindow_old";
ALTER TYPE "TimeWindow_new" RENAME TO "TimeWindow";
DROP TYPE "public"."TimeWindow_old";
COMMIT;
