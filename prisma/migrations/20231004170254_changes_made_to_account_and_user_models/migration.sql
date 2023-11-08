/*
  Warnings:

  - The `userId` column on the `Account` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ownerId` on the `Character` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_ownerId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "ownerId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountId" INTEGER;

-- CreateTable
CREATE TABLE "UserCharacter" (
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,

    CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("userId","characterId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_accountId_key" ON "User"("accountId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
