-- CreateTable
CREATE TABLE "UserIdentityLink" (
    "id" SERIAL NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'linked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentityClaim" (
    "id" SERIAL NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "draftId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedByClerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserIdentityClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentityLink_provider_providerUserId_key" ON "UserIdentityLink"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentityLink_clerkUserId_provider_key" ON "UserIdentityLink"("clerkUserId", "provider");

-- CreateIndex
CREATE INDEX "UserIdentityLink_clerkUserId_idx" ON "UserIdentityLink"("clerkUserId");

-- CreateIndex
CREATE INDEX "UserIdentityClaim_clerkUserId_provider_idx" ON "UserIdentityClaim"("clerkUserId", "provider");

-- CreateIndex
CREATE INDEX "UserIdentityClaim_provider_providerUserId_idx" ON "UserIdentityClaim"("provider", "providerUserId");

-- AddForeignKey
ALTER TABLE "UserIdentityLink" ADD CONSTRAINT "UserIdentityLink_clerkUserId_fkey" FOREIGN KEY ("clerkUserId") REFERENCES "User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentityClaim" ADD CONSTRAINT "UserIdentityClaim_clerkUserId_fkey" FOREIGN KEY ("clerkUserId") REFERENCES "User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;
