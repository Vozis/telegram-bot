/*
  Warnings:

  - A unique constraint covering the columns `[name,groupId,day,time]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CronJobType" ADD VALUE 'TEST';

-- AlterEnum
ALTER TYPE "LessonTypeEnum" ADD VALUE 'ATTESTATION';

-- DropIndex
DROP INDEX "lessons_groupId_day_time_key";

-- CreateIndex
CREATE UNIQUE INDEX "lessons_name_groupId_day_time_key" ON "lessons"("name", "groupId", "day", "time");
