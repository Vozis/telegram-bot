/*
  Warnings:

  - You are about to drop the column `level` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "level" "Level" NOT NULL DEFAULT 'BASE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "level";
