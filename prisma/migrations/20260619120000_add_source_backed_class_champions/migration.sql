CREATE TABLE "ClassChampion" (
    "id" SERIAL NOT NULL,
    "heraldServerName" TEXT NOT NULL,
    "canonicalClassName" TEXT NOT NULL,
    "realm" TEXT NOT NULL,
    "webId" TEXT NOT NULL,
    "heraldName" TEXT NOT NULL,
    "heraldRealmPoints" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceRank" INTEGER NOT NULL,
    "sourceFetchedAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "validationStatus" TEXT NOT NULL,
    "validationError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassChampion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassChampion_heraldServerName_canonicalClassName_realm_key" ON "ClassChampion"("heraldServerName", "canonicalClassName", "realm");

CREATE INDEX "ClassChampion_webId_idx" ON "ClassChampion"("webId");

CREATE INDEX "ClassChampion_validationStatus_validatedAt_idx" ON "ClassChampion"("validationStatus", "validatedAt");
