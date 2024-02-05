/*
  Warnings:

  - The primary key for the `GroupUser` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "GroupUser" DROP CONSTRAINT "GroupUser_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "GroupUser_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "GroupUser_groupId_clerkUserId_idx" ON "GroupUser"("groupId", "clerkUserId");
