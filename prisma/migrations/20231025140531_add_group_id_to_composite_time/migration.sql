/*
  Warnings:

  - A unique constraint covering the columns `[groupId,day,time]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "lessons_day_time_key";

-- CreateIndex
CREATE UNIQUE INDEX "lessons_groupId_day_time_key" ON "lessons"("groupId", "day", "time");
