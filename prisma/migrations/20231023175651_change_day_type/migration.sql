/*
  Warnings:

  - Changed the type of `day` on the `lessons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "day",
ADD COLUMN     "day" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Day";

-- CreateIndex
CREATE UNIQUE INDEX "lessons_day_hour_minutes_key" ON "lessons"("day", "hour", "minutes");
