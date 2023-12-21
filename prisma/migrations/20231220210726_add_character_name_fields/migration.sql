-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "characterName" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "previousCharacterName" TEXT;
