/*
  Warnings:

  - You are about to drop the column `className` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `guildName` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `realm` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `realmPoints` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `serverName` on the `Character` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[webId]` on the table `Character` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "className",
DROP COLUMN "guildName",
DROP COLUMN "level",
DROP COLUMN "name",
DROP COLUMN "realm",
DROP COLUMN "realmPoints",
DROP COLUMN "serverName";

-- CreateIndex
CREATE UNIQUE INDEX "Character_webId_key" ON "Character"("webId");
