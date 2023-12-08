/*
  Warnings:

  - The `time` column on the `lessons` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "time",
ADD COLUMN     "time" TIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "lessons_groupId_day_time_key" ON "lessons"("groupId", "day", "time");
