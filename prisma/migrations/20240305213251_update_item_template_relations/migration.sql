/*
  Warnings:

  - You are about to drop the column `itemId` on the `Bonus` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ItemToTemplate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `class` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_classId_fkey";

-- DropForeignKey
ALTER TABLE "_ItemToTemplate" DROP CONSTRAINT "_ItemToTemplate_A_fkey";

-- DropForeignKey
ALTER TABLE "_ItemToTemplate" DROP CONSTRAINT "_ItemToTemplate_B_fkey";

-- AlterTable
ALTER TABLE "Bonus" DROP COLUMN "itemId",
ADD COLUMN     "armorId" INTEGER,
ADD COLUMN     "instrumentId" INTEGER,
ADD COLUMN     "jewelryId" INTEGER,
ADD COLUMN     "otherItemId" INTEGER,
ADD COLUMN     "shieldId" INTEGER,
ADD COLUMN     "weaponId" INTEGER;

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "classId",
ADD COLUMN     "class" TEXT NOT NULL;

-- DropTable
DROP TABLE "Class";

-- DropTable
DROP TABLE "Item";

-- DropTable
DROP TABLE "_ItemToTemplate";

-- CreateTable
CREATE TABLE "Weapon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "realm" INTEGER NOT NULL,
    "twoHanded" BOOLEAN NOT NULL DEFAULT false,
    "damageType" INTEGER,
    "templateId" INTEGER,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Armor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "realm" INTEGER NOT NULL,
    "slot" TEXT NOT NULL,
    "absorption" INTEGER,
    "templateId" INTEGER,

    CONSTRAINT "Armor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shield" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "realm" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "templateId" INTEGER,

    CONSTRAINT "Shield_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "realm" INTEGER NOT NULL,
    "templateId" INTEGER,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jewelry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "realm" INTEGER NOT NULL,
    "templateId" INTEGER,

    CONSTRAINT "Jewelry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "realm" INTEGER NOT NULL,
    "templateId" INTEGER,

    CONSTRAINT "OtherItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_armorId_fkey" FOREIGN KEY ("armorId") REFERENCES "Armor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_shieldId_fkey" FOREIGN KEY ("shieldId") REFERENCES "Shield"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_otherItemId_fkey" FOREIGN KEY ("otherItemId") REFERENCES "OtherItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Armor" ADD CONSTRAINT "Armor_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shield" ADD CONSTRAINT "Shield_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instrument" ADD CONSTRAINT "Instrument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jewelry" ADD CONSTRAINT "Jewelry_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherItem" ADD CONSTRAINT "OtherItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
