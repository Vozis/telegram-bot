-- CreateEnum
CREATE TYPE "LessonTypeEnum" AS ENUM ('LECTURE', 'SEMINAR');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "type" "LessonTypeEnum" NOT NULL DEFAULT 'SEMINAR';
