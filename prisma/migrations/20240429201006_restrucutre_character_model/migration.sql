/*
  Warnings:

  - You are about to drop the column `herald` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "herald",
ADD COLUMN     "heraldAlbionDeathBlows" INTEGER,
ADD COLUMN     "heraldAlbionDeaths" INTEGER,
ADD COLUMN     "heraldAlbionKills" INTEGER,
ADD COLUMN     "heraldAlbionSoloKills" INTEGER,
ADD COLUMN     "heraldBountyPoints" INTEGER,
ADD COLUMN     "heraldCharacterWebId" TEXT,
ADD COLUMN     "heraldClassName" TEXT,
ADD COLUMN     "heraldGuildName" TEXT,
ADD COLUMN     "heraldLevel" INTEGER,
ADD COLUMN     "heraldMasterLevel" TEXT,
ADD COLUMN     "heraldMidgardDeathBlows" INTEGER,
ADD COLUMN     "heraldMidgardDeaths" INTEGER,
ADD COLUMN     "heraldMidgardKills" INTEGER,
ADD COLUMN     "heraldMidgardSoloKills" INTEGER,
ADD COLUMN     "heraldName" TEXT,
ADD COLUMN     "heraldRace" TEXT,
ADD COLUMN     "heraldRealm" INTEGER,
ADD COLUMN     "heraldRealmPoints" INTEGER,
ADD COLUMN     "heraldServerName" TEXT,
ADD COLUMN     "heraldTotalDeathBlows" INTEGER,
ADD COLUMN     "heraldTotalDeaths" INTEGER,
ADD COLUMN     "heraldTotalKills" INTEGER,
ADD COLUMN     "heraldTotalSoloKills" INTEGER;
