-- CreateTable
CREATE TABLE "cron_jobs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "lessonId" INTEGER NOT NULL,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cron_jobs_name_key" ON "cron_jobs"("name");

-- AddForeignKey
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
