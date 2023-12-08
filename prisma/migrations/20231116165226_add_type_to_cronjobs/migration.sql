-- CreateEnum
CREATE TYPE "CronJobType" AS ENUM ('LESSON', 'TASK');

-- AlterTable
ALTER TABLE "cron_jobs" ADD COLUMN     "type" "CronJobType" NOT NULL DEFAULT 'LESSON';
