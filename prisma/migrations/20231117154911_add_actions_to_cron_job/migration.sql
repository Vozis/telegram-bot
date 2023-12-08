-- AlterTable
ALTER TABLE "cron_jobs" ADD COLUMN     "actions" TEXT[] DEFAULT ARRAY[]::TEXT[];
