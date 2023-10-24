/*
  Warnings:

  - A unique constraint covering the columns `[day,hour,minutes]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "lessons_day_hour_minutes_key" ON "lessons"("day", "hour", "minutes");
