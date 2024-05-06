-- CreateTable
CREATE TABLE "HeraldBatchState" (
    "key" TEXT NOT NULL,
    "lastProcessedCharacterId" INTEGER NOT NULL,

    CONSTRAINT "HeraldBatchState_pkey" PRIMARY KEY ("key")
);
