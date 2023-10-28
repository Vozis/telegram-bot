-- DropForeignKey
ALTER TABLE "cron_jobs" DROP CONSTRAINT "cron_jobs_groupId_fkey";

-- AlterTable
ALTER TABLE "cron_jobs" ALTER COLUMN "groupId" SET DATA TYPE DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("telegram_id") ON DELETE CASCADE ON UPDATE CASCADE;
