/*
  Warnings:

  - You are about to drop the column `isInRoster` on the `GroupUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupUser" DROP COLUMN "isInRoster",
ADD COLUMN     "isInActiveGroup" BOOLEAN NOT NULL DEFAULT false;
