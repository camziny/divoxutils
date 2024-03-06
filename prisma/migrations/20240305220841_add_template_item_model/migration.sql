/*
  Warnings:

  - You are about to drop the column `templateId` on the `Armor` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `Instrument` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `Jewelry` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `OtherItem` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `Shield` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `Weapon` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Armor" DROP CONSTRAINT "Armor_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Instrument" DROP CONSTRAINT "Instrument_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Jewelry" DROP CONSTRAINT "Jewelry_templateId_fkey";

-- DropForeignKey
ALTER TABLE "OtherItem" DROP CONSTRAINT "OtherItem_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Shield" DROP CONSTRAINT "Shield_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Weapon" DROP CONSTRAINT "Weapon_templateId_fkey";

-- AlterTable
ALTER TABLE "Armor" DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "Instrument" DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "Jewelry" DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "OtherItem" DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "Shield" DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "Weapon" DROP COLUMN "templateId";

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "armorId" INTEGER,
    "weaponId" INTEGER,
    "shieldId" INTEGER,
    "instrumentId" INTEGER,
    "jewelryId" INTEGER,
    "otherItemId" INTEGER,

    CONSTRAINT "TemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateItem_templateId_armorId_weaponId_shieldId_instrumen_key" ON "TemplateItem"("templateId", "armorId", "weaponId", "shieldId", "instrumentId", "jewelryId", "otherItemId");

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_armorId_fkey" FOREIGN KEY ("armorId") REFERENCES "Armor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_shieldId_fkey" FOREIGN KEY ("shieldId") REFERENCES "Shield"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_otherItemId_fkey" FOREIGN KEY ("otherItemId") REFERENCES "OtherItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
