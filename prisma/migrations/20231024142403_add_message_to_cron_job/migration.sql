-- AlterTable
ALTER TABLE "cron_jobs" ADD COLUMN     "message" VARCHAR(200) NOT NULL DEFAULT 'Новое уведомление';
