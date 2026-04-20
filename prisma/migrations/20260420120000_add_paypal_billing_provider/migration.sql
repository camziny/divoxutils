CREATE TYPE "BillingProvider" AS ENUM ('stripe', 'paypal');

ALTER TABLE "User"
ADD COLUMN "paypalPayerId" TEXT,
ADD COLUMN "paypalSubscriptionId" TEXT,
ADD COLUMN "subscriptionProvider" "BillingProvider";

CREATE UNIQUE INDEX "User_paypalPayerId_key" ON "User"("paypalPayerId");
CREATE UNIQUE INDEX "User_paypalSubscriptionId_key" ON "User"("paypalSubscriptionId");

CREATE TABLE "BillingWebhookEvent" (
    "id" SERIAL NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingWebhookEvent_provider_externalEventId_key"
ON "BillingWebhookEvent"("provider", "externalEventId");
