/*
  Warnings:

  - You are about to drop the column `realmId` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the `Realm` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_realmId_fkey";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "realmId",
ADD COLUMN     "realm" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "Realm";
