-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "deathBlowsLastWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeathBlows" INTEGER NOT NULL DEFAULT 0;
