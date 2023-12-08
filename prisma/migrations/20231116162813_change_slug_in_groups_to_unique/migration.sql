/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `groups` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "slug" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");
