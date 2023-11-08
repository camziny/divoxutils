/*
  Warnings:

  - Added the required column `className` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serverName` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "className" TEXT NOT NULL,
ADD COLUMN     "guildName" TEXT,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "serverName" TEXT NOT NULL,
ADD COLUMN     "webId" TEXT NOT NULL;
