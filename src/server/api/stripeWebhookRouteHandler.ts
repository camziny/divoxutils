import type Stripe from "stripe";

type StripeUser = {
  clerkUserId: string;
  subscriptionProvider?: "stripe" | "paypal" | null;
  subscriptionProviderUpdatedAt?: Date | null;
  stripeSubscriptionId?: string | null;
  paypalSubscriptionId?: string | null;
};

type StripeWebhookDeps = {
  getWebhookSecret: () => string;
  constructEvent: (rawBody: Buffer, signature: string, secret: string) => Stripe.Event;
  getPriceMap: () => Record<number, string>;
  markEventProcessed: (eventId: string) => Promise<boolean>;
  unmarkEventProcessed: (eventId: string) => Promise<void>;
  findUserByClerkUserId: (clerkUserId: string) => Promise<StripeUser | null>;
  findUserByStripeCustomerId: (stripeCustomerId: string) => Promise<StripeUser | null>;
  updateUserSubscription: (
    clerkUserId: string,
    data: {
      subscriptionProvider?: "stripe" | "paypal" | null;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      paypalPayerId?: string | null;
      paypalSubscriptionId?: string | null;
      pendingSubscriptionPriceId?: string | null;
      subscriptionProviderUpdatedAt?: Date | null;
      subscriptionStatus?: string | null;
      subscriptionPriceId?: string | null;
      subscriptionCurrentPeriodEnd?: Date | null;
      subscriptionCancelAtPeriodEnd?: boolean;
      supporterTier?: number;
    }
  ) => Promise<void>;
  extractRecurringPriceId: (subscription: Stripe.Subscription) => string | null;
  getTierFromPriceId: (priceId: string | null, priceMap: Record<number, string>) => number;
  shouldGrantSupporterBadge: (status: string) => boolean;
};

export type StripeWebhookInput = {
  method: string;
  signature: string | null;
  rawBody: Buffer;
};

export type StripeWebhookResponse = {
  status: number;
  body: { error: string } | { received: true; duplicate?: true };
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const resolveCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null => {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id ?? null;
};

const resolveSubscriptionId = (
  subscription: string | Stripe.Subscription | null | undefined
): string | null => {
  if (!subscription) return null;
  if (typeof subscription === "string") return subscription;
  return subscription.id ?? null;
};

const toDateFromUnixSeconds = (value: number | null | undefined): Date | null => {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1000);
};

const resolveSubscriptionPeriodEndSeconds = (
  subscription: Stripe.Subscription
): number | null => {
  const typedSubscription = subscription as unknown as { current_period_end?: number | null };
  const subscriptionLevel = typedSubscription.current_period_end;
  if (typeof subscriptionLevel === "number" && Number.isFinite(subscriptionLevel)) {
    return subscriptionLevel;
  }
  const [primaryItem] = subscription.items.data;
  const itemLevel = primaryItem?.current_period_end;
  if (typeof itemLevel === "number" && Number.isFinite(itemLevel)) {
    return itemLevel;
  }
  return null;
};

const isStaleStripeSubscriptionEventForPayPalSubscriber = (
  user: StripeUser,
  subscription: Stripe.Subscription
): boolean => {
  if (user.subscriptionProvider !== "paypal" && !user.paypalSubscriptionId) return false;
  const trackedStripeSubscriptionId = user.stripeSubscriptionId ?? null;
  if (trackedStripeSubscriptionId && trackedStripeSubscriptionId === subscription.id) return false;
  return true;
};

const isOutOfOrderProviderEvent = (user: StripeUser, occurredAt: Date | null): boolean => {
  if (!occurredAt || !user.subscriptionProviderUpdatedAt) return false;
  return occurredAt.getTime() < user.subscriptionProviderUpdatedAt.getTime();
};

const syncFromSubscription = async (
  subscription: Stripe.Subscription,
  occurredAt: Date | null,
  deps: StripeWebhookDeps
) => {
  const customerId = resolveCustomerId(subscription.customer);
  const metadataClerkUserId = asString(subscription.metadata?.clerkUserId);
  if (!customerId && !metadataClerkUserId) {
    return;
  }

  const user =
    (customerId ? await deps.findUserByStripeCustomerId(customerId) : null) ??
    (metadataClerkUserId ? await deps.findUserByClerkUserId(metadataClerkUserId) : null);

  if (!user) return;

  if (isStaleStripeSubscriptionEventForPayPalSubscriber(user, subscription)) {
    return;
  }
  if (isOutOfOrderProviderEvent(user, occurredAt)) {
    return;
  }

  const priceId = deps.extractRecurringPriceId(subscription);
  const tier = deps.shouldGrantSupporterBadge(subscription.status)
    ? deps.getTierFromPriceId(priceId, deps.getPriceMap())
    : 0;

  await deps.updateUserSubscription(user.clerkUserId, {
    subscriptionProvider: "stripe",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    paypalPayerId: null,
    paypalSubscriptionId: null,
    pendingSubscriptionPriceId: null,
    subscriptionProviderUpdatedAt: occurredAt ?? new Date(),
    subscriptionStatus: subscription.status,
    subscriptionPriceId: priceId,
    subscriptionCurrentPeriodEnd: toDateFromUnixSeconds(
      resolveSubscriptionPeriodEndSeconds(subscription)
    ),
    subscriptionCancelAtPeriodEnd: Boolean(
      subscription.cancel_at_period_end || subscription.cancel_at
    ),
    supporterTier: tier,
  });
};

const syncFromCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
  occurredAt: Date | null,
  deps: StripeWebhookDeps
) => {
  if (session.mode !== "subscription") return;

  const clerkUserId =
    asString(session.metadata?.clerkUserId) ?? asString(session.client_reference_id);
  const customerId = resolveCustomerId(session.customer);
  const subscriptionId = resolveSubscriptionId(session.subscription);

  if (!clerkUserId || !customerId || !subscriptionId) return;
  const user = await deps.findUserByClerkUserId(clerkUserId);
  if (!user) return;
  if (isOutOfOrderProviderEvent(user, occurredAt)) {
    return;
  }

  await deps.updateUserSubscription(clerkUserId, {
    subscriptionProvider: "stripe",
    subscriptionProviderUpdatedAt: occurredAt ?? new Date(),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    paypalPayerId: null,
    paypalSubscriptionId: null,
    pendingSubscriptionPriceId: null,
  });
};

export const createStripeWebhookHandler =
  (deps: StripeWebhookDeps) =>
  async (input: StripeWebhookInput): Promise<StripeWebhookResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    if (!input.signature) {
      return { status: 400, body: { error: "Missing Stripe signature header." } };
    }

    let event: Stripe.Event;
    try {
      event = deps.constructEvent(input.rawBody, input.signature, deps.getWebhookSecret());
    } catch {
      return { status: 401, body: { error: "Invalid Stripe webhook signature." } };
    }

    const wasMarked = await deps.markEventProcessed(event.id);
    if (!wasMarked) {
      return { status: 200, body: { received: true, duplicate: true } };
    }

    try {
      const occurredAt = toDateFromUnixSeconds(event.created);
      if (event.type === "checkout.session.completed") {
        await syncFromCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          occurredAt,
          deps
        );
      } else if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        await syncFromSubscription(event.data.object as Stripe.Subscription, occurredAt, deps);
      } else if (event.type === "customer.subscription.deleted") {
        await syncFromSubscription(event.data.object as Stripe.Subscription, occurredAt, deps);
      }
    } catch {
      await deps.unmarkEventProcessed(event.id);
      return { status: 500, body: { error: "Failed to process Stripe webhook event." } };
    }

    return { status: 200, body: { received: true } };
  };
