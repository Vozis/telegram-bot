/*
  Warnings:

  - You are about to drop the column `chat_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `telegram_id` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telegram_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "telegram_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "chat_id",
ADD COLUMN     "telegram_id" INTEGER NOT NULL;
