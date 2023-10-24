/*
  Warnings:

  - The `level` column on the `groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `cron_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LevelEnum" AS ENUM ('BASE', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "cron_jobs" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "level",
ADD COLUMN     "level" "LevelEnum" NOT NULL DEFAULT 'BASE';

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "Level";
