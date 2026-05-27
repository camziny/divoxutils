CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "User_supporterTier_idx" ON "User"("supporterTier");

CREATE INDEX "Character_characterName_idx" ON "Character"("characterName");
CREATE INDEX "Character_lastUpdated_id_idx" ON "Character"("lastUpdated", "id");
CREATE INDEX "Character_nameLastUpdated_id_idx" ON "Character"("nameLastUpdated", "id");

CREATE INDEX "UserIdentityLink_provider_status_idx" ON "UserIdentityLink"("provider", "status");

CREATE INDEX "UserIdentityClaim_status_createdAt_idx" ON "UserIdentityClaim"("status", "createdAt");
CREATE INDEX "UserIdentityClaim_clerkUserId_provider_providerUserId_status_idx" ON "UserIdentityClaim"("clerkUserId", "provider", "providerUserId", "status");

CREATE INDEX "User_name_trgm_idx" ON "User" USING gin ("name" gin_trgm_ops);
CREATE INDEX "User_email_trgm_idx" ON "User" USING gin ("email" gin_trgm_ops);
CREATE INDEX "Character_heraldName_trgm_idx" ON "Character" USING gin ("heraldName" gin_trgm_ops);

CREATE INDEX "User_subscription_provider_idx" ON "User"("subscriptionProvider")
WHERE "subscriptionProvider" IS NOT NULL
   OR "stripeSubscriptionId" IS NOT NULL
   OR "stripeCustomerId" IS NOT NULL
   OR "paypalSubscriptionId" IS NOT NULL
   OR "paypalPayerId" IS NOT NULL;
