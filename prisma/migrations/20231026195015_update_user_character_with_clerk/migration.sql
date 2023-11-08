/*
  Warnings:

  - The primary key for the `UserCharacter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `UserCharacter` table. All the data in the column will be lost.
  - Made the column `clerkUserId` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clerkUserId` to the `UserCharacter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserCharacter" DROP CONSTRAINT "UserCharacter_userId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "clerkUserId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserCharacter" DROP CONSTRAINT "UserCharacter_pkey",
DROP COLUMN "userId",
ADD COLUMN     "clerkUserId" TEXT NOT NULL,
ADD CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("clerkUserId", "characterId");

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_clerkUserId_fkey" FOREIGN KEY ("clerkUserId") REFERENCES "User"("clerkUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
