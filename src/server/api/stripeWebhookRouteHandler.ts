import type Stripe from "stripe";

type StripeUser = {
  clerkUserId: string;
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
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
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

const syncFromSubscription = async (
  subscription: Stripe.Subscription,
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

  const priceId = deps.extractRecurringPriceId(subscription);
  const tier = deps.shouldGrantSupporterBadge(subscription.status)
    ? deps.getTierFromPriceId(priceId, deps.getPriceMap())
    : 0;

  await deps.updateUserSubscription(user.clerkUserId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
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
  deps: StripeWebhookDeps
) => {
  if (session.mode !== "subscription") return;

  const clerkUserId =
    asString(session.metadata?.clerkUserId) ?? asString(session.client_reference_id);
  const customerId = resolveCustomerId(session.customer);
  const subscriptionId = resolveSubscriptionId(session.subscription);

  if (!clerkUserId || !customerId) return;
  const user = await deps.findUserByClerkUserId(clerkUserId);
  if (!user) return;

  await deps.updateUserSubscription(clerkUserId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
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
      if (event.type === "checkout.session.completed") {
        await syncFromCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, deps);
      } else if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        await syncFromSubscription(event.data.object as Stripe.Subscription, deps);
      } else if (event.type === "customer.subscription.deleted") {
        await syncFromSubscription(event.data.object as Stripe.Subscription, deps);
      }
    } catch {
      await deps.unmarkEventProcessed(event.id);
      return { status: 500, body: { error: "Failed to process Stripe webhook event." } };
    }

    return { status: 200, body: { received: true } };
  };
