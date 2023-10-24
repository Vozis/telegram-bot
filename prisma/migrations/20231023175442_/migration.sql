/*
  Warnings:

  - The values [MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY] on the enum `Day` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Day_new" AS ENUM ('понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота');
ALTER TABLE "lessons" ALTER COLUMN "day" DROP DEFAULT;
ALTER TABLE "lessons" ALTER COLUMN "day" TYPE "Day_new" USING ("day"::text::"Day_new");
ALTER TYPE "Day" RENAME TO "Day_old";
ALTER TYPE "Day_new" RENAME TO "Day";
DROP TYPE "Day_old";
ALTER TABLE "lessons" ALTER COLUMN "day" SET DEFAULT 'понедельник';
COMMIT;

-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "day" SET DEFAULT 'понедельник';
