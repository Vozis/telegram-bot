/*
  Warnings:

  - You are about to drop the column `day` on the `lessons` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[day_number,hour,minutes]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "lessons_day_hour_minutes_key";

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "day",
ADD COLUMN     "day_number" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "lessons_day_number_hour_minutes_key" ON "lessons"("day_number", "hour", "minutes");
