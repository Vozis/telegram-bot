/*
  Warnings:

  - You are about to drop the column `day_number` on the `lessons` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[day,hour,minutes]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- DropIndex
DROP INDEX "lessons_day_number_hour_minutes_key";

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "day_number",
ADD COLUMN     "day" "Day" NOT NULL DEFAULT 'MONDAY';

-- CreateIndex
CREATE UNIQUE INDEX "lessons_day_hour_minutes_key" ON "lessons"("day", "hour", "minutes");
