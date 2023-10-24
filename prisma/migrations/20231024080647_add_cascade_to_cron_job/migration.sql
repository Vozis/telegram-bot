-- DropForeignKey
ALTER TABLE "cron_jobs" DROP CONSTRAINT "cron_jobs_lessonId_fkey";

-- AddForeignKey
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
