-- CreateTable
CREATE TABLE "Lesson" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "hour" INTEGER NOT NULL DEFAULT 12,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "enable" BOOLEAN NOT NULL DEFAULT true,
    "groupId" INTEGER,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
