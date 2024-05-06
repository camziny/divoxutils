/*
  Warnings:

  - You are about to drop the `Armor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Bonus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Instrument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Jewelry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OtherItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shield` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Weapon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_armorId_fkey";

-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_instrumentId_fkey";

-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_jewelryId_fkey";

-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_otherItemId_fkey";

-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_shieldId_fkey";

-- DropForeignKey
ALTER TABLE "Bonus" DROP CONSTRAINT "Bonus_weaponId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_userId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_armorId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_instrumentId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_jewelryId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_otherItemId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_shieldId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateItem" DROP CONSTRAINT "TemplateItem_weaponId_fkey";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "herald" JSONB[];

-- DropTable
DROP TABLE "Armor";

-- DropTable
DROP TABLE "Bonus";

-- DropTable
DROP TABLE "Instrument";

-- DropTable
DROP TABLE "Jewelry";

-- DropTable
DROP TABLE "OtherItem";

-- DropTable
DROP TABLE "Shield";

-- DropTable
DROP TABLE "Template";

-- DropTable
DROP TABLE "TemplateItem";

-- DropTable
DROP TABLE "Weapon";
