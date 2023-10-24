/*
  Warnings:

  - You are about to drop the column `hour` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `minutes` on the `lessons` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[day,time]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "lessons_day_hour_minutes_key";

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "hour",
DROP COLUMN "minutes",
ADD COLUMN     "time" INTEGER NOT NULL DEFAULT 720;

-- CreateIndex
CREATE UNIQUE INDEX "lessons_day_time_key" ON "lessons"("day", "time");
