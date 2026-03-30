-- CreateEnum
CREATE TYPE "AbilityCategory" AS ENUM ('RA9', 'RA5', 'RR5');

-- CreateEnum
CREATE TYPE "AbilityType" AS ENUM ('Passive', 'Active', 'Passive_total');

-- CreateEnum
CREATE TYPE "SpecLineType" AS ENUM ('weapon', 'spells', 'abilities', 'songs', 'other');

-- CreateEnum
CREATE TYPE "SpecItemType" AS ENUM ('spell', 'style', 'passive', 'song', 'chant', 'aura', 'ability', 'other');

-- CreateTable
CREATE TABLE "Realm" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Realm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "realmId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "family_code" INTEGER,
    "code" INTEGER,
    "archetype" TEXT,
    "armor_type" TEXT,
    "base_weapons" JSONB,
    "source_url" TEXT NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecLine" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SpecLineType" NOT NULL,
    "description" TEXT,
    "code" INTEGER,

    CONSTRAINT "SpecLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecItem" (
    "id" TEXT NOT NULL,
    "specLineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SpecItemType" NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "properties" JSONB,
    "code" INTEGER,

    CONSTRAINT "SpecItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecItemRank" (
    "id" TEXT NOT NULL,
    "specItemId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "character_level" INTEGER,
    "spec_level" INTEGER,
    "properties" JSONB,

    CONSTRAINT "SpecItemRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealmAbility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbr" TEXT,
    "category" "AbilityCategory" NOT NULL,
    "type" "AbilityType",
    "description" TEXT NOT NULL,
    "cooldown_seconds" INTEGER,
    "class_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealmAbility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealmAbilityLevel" (
    "id" TEXT NOT NULL,
    "abilityId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "effect" TEXT NOT NULL,
    "cost" INTEGER,

    CONSTRAINT "RealmAbilityLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryLevelCost" (
    "category" "AbilityCategory" NOT NULL,
    "level" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,

    CONSTRAINT "CategoryLevelCost_pkey" PRIMARY KEY ("category","level")
);

-- CreateIndex
CREATE UNIQUE INDEX "Realm_slug_key" ON "Realm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Class_realmId_slug_key" ON "Class"("realmId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SpecLine_classId_slug_key" ON "SpecLine"("classId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SpecItem_specLineId_slug_key" ON "SpecItem"("specLineId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SpecItemRank_specItemId_rank_key" ON "SpecItemRank"("specItemId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "RealmAbility_name_category_key" ON "RealmAbility"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "RealmAbilityLevel_abilityId_level_key" ON "RealmAbilityLevel"("abilityId", "level");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_realmId_fkey" FOREIGN KEY ("realmId") REFERENCES "Realm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecLine" ADD CONSTRAINT "SpecLine_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecItem" ADD CONSTRAINT "SpecItem_specLineId_fkey" FOREIGN KEY ("specLineId") REFERENCES "SpecLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecItemRank" ADD CONSTRAINT "SpecItemRank_specItemId_fkey" FOREIGN KEY ("specItemId") REFERENCES "SpecItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealmAbilityLevel" ADD CONSTRAINT "RealmAbilityLevel_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "RealmAbility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
