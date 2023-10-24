/*
  Warnings:

  - You are about to drop the `Lesson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_groupId_fkey";

-- DropTable
DROP TABLE "Lesson";

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "hour" INTEGER NOT NULL DEFAULT 12,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "is_enable" BOOLEAN NOT NULL DEFAULT true,
    "groupId" INTEGER,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
