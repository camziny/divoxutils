UPDATE "User"
SET "subscriptionProvider" = 'stripe'
WHERE "subscriptionProvider" IS NULL
  AND ("stripeSubscriptionId" IS NOT NULL OR "stripeCustomerId" IS NOT NULL);

UPDATE "User"
SET "subscriptionProvider" = 'paypal'
WHERE "subscriptionProvider" IS NULL
  AND ("paypalSubscriptionId" IS NOT NULL OR "paypalPayerId" IS NOT NULL);
