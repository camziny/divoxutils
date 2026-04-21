import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";

type PayPalWebhookResource = {
  id?: string;
  status?: string;
  custom_id?: string;
  plan_id?: string;
  subscriber?: {
    payer_id?: string;
  };
  billing_info?: {
    next_billing_time?: string;
  };
};

type PayPalWebhookEvent = {
  id?: string;
  create_time?: string;
  event_type?: string;
  resource?: PayPalWebhookResource;
};

type PayPalWebhookDeps = {
  markEventProcessed: (externalEventId: string) => Promise<boolean>;
  unmarkEventProcessed: (externalEventId: string) => Promise<void>;
  verifyWebhook: (params: {
    transmissionId: string;
    transmissionTime: string;
    transmissionSig: string;
    certUrl: string;
    authAlgo: string;
    webhookEvent: Record<string, unknown>;
  }) => Promise<boolean>;
  getPlanMap: () => Record<number, string>;
  shouldGrantSupporterBadge: (status: string) => boolean;
  findUserByClerkUserId: (clerkUserId: string) => Promise<{
    clerkUserId: string;
    subscriptionProvider?: "stripe" | "paypal" | null;
    subscriptionProviderUpdatedAt?: Date | null;
    stripeSubscriptionId?: string | null;
    paypalSubscriptionId?: string | null;
    subscriptionPriceId: string | null;
    pendingSubscriptionPriceId: string | null;
    subscriptionCurrentPeriodEnd?: Date | null;
  } | null>;
  findUserByPayPalSubscriptionId: (
    paypalSubscriptionId: string
  ) => Promise<{
    clerkUserId: string;
    subscriptionProvider?: "stripe" | "paypal" | null;
    subscriptionProviderUpdatedAt?: Date | null;
    stripeSubscriptionId?: string | null;
    paypalSubscriptionId?: string | null;
    subscriptionPriceId: string | null;
    pendingSubscriptionPriceId: string | null;
    subscriptionCurrentPeriodEnd?: Date | null;
  } | null>;
  findUserByPayPalPayerId: (paypalPayerId: string) => Promise<{
    clerkUserId: string;
    subscriptionProvider?: "stripe" | "paypal" | null;
    subscriptionProviderUpdatedAt?: Date | null;
    stripeSubscriptionId?: string | null;
    paypalSubscriptionId?: string | null;
    subscriptionPriceId: string | null;
    pendingSubscriptionPriceId: string | null;
    subscriptionCurrentPeriodEnd?: Date | null;
  } | null>;
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
};

export type PayPalWebhookInput = {
  method: string;
  headers: Headers;
  body: Record<string, unknown>;
};

export type PayPalWebhookResponse = {
  status: number;
  body: { error: string } | { received: true; duplicate?: true };
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "active",
  SUSPENDED: "past_due",
  CANCELLED: "canceled",
  EXPIRED: "canceled",
  APPROVAL_PENDING: "incomplete",
  APPROVED: "incomplete",
};

const toInternalStatus = (status: string | undefined): string | null => {
  if (!status) return null;
  return STATUS_MAP[status] ?? status.toLowerCase();
};

const getTierFromPlanId = (planId: string | null, planMap: Record<number, string>): number => {
  if (!planId) return 0;
  const match = Object.entries(planMap).find(([, value]) => value === planId);
  if (!match) return 0;
  return Number(match[0]);
};

const toDate = (iso: string | undefined): Date | null => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const resolveEventOccurredAt = (
  event: PayPalWebhookEvent,
  transmissionTime: string
): Date | null => {
  return toDate(event.create_time) ?? toDate(transmissionTime);
};

const extractVerificationHeaders = (headers: Headers) => {
  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const transmissionSig = headers.get("paypal-transmission-sig");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return null;
  }
  return { transmissionId, transmissionTime, transmissionSig, certUrl, authAlgo };
};

const findLinkedUser = async (
  resource: PayPalWebhookResource,
  deps: PayPalWebhookDeps
): Promise<{
  clerkUserId: string;
  subscriptionProvider?: "stripe" | "paypal" | null;
  subscriptionProviderUpdatedAt?: Date | null;
  stripeSubscriptionId?: string | null;
  paypalSubscriptionId?: string | null;
  subscriptionPriceId: string | null;
  pendingSubscriptionPriceId: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
} | null> => {
  const clerkUserId = resource.custom_id;
  if (typeof clerkUserId === "string" && clerkUserId.length > 0) {
    const user = await deps.findUserByClerkUserId(clerkUserId);
    if (user) return user;
  }
  const paypalSubscriptionId = resource.id;
  if (typeof paypalSubscriptionId === "string" && paypalSubscriptionId.length > 0) {
    const user = await deps.findUserByPayPalSubscriptionId(paypalSubscriptionId);
    if (user) return user;
  }
  const payerId = resource.subscriber?.payer_id;
  if (typeof payerId === "string" && payerId.length > 0) {
    const user = await deps.findUserByPayPalPayerId(payerId);
    if (user) return user;
  }
  return null;
};

const isStalePayPalEventForStripeSubscriber = (
  user: {
    clerkUserId: string;
    subscriptionProvider?: "stripe" | "paypal" | null;
    stripeSubscriptionId?: string | null;
    paypalSubscriptionId?: string | null;
  },
  resource: PayPalWebhookResource,
  eventType: string | undefined
): boolean => {
  if (user.subscriptionProvider !== "stripe" && !user.stripeSubscriptionId) return false;
  const eventClerkUserId =
    typeof resource.custom_id === "string" && resource.custom_id.length > 0
      ? resource.custom_id
      : null;
  if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED" && eventClerkUserId === user.clerkUserId) {
    return false;
  }
  const eventPayPalSubscriptionId =
    typeof resource.id === "string" && resource.id.length > 0 ? resource.id : null;
  const trackedPayPalSubscriptionId = user.paypalSubscriptionId ?? null;
  if (trackedPayPalSubscriptionId && trackedPayPalSubscriptionId === eventPayPalSubscriptionId) {
    return false;
  }
  return true;
};

const isOutOfOrderProviderEvent = (
  user: {
    subscriptionProviderUpdatedAt?: Date | null;
  },
  occurredAt: Date | null
): boolean => {
  if (!occurredAt || !user.subscriptionProviderUpdatedAt) return false;
  return occurredAt.getTime() < user.subscriptionProviderUpdatedAt.getTime();
};

export const createPayPalWebhookHandler =
  (deps: PayPalWebhookDeps) =>
  async (input: PayPalWebhookInput): Promise<PayPalWebhookResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { error: "Method not allowed" } };
    }

    const verificationHeaders = extractVerificationHeaders(input.headers);
    if (!verificationHeaders) {
      return { status: 400, body: { error: "Missing PayPal verification headers." } };
    }

    const event = input.body as PayPalWebhookEvent;
    const eventId = typeof event.id === "string" && event.id.length > 0 ? event.id : null;
    if (!eventId) {
      return { status: 400, body: { error: "Missing PayPal webhook event id." } };
    }

    const isValid = await deps.verifyWebhook({
      ...verificationHeaders,
      webhookEvent: input.body,
    });
    if (!isValid) {
      return { status: 401, body: { error: "Invalid PayPal webhook signature." } };
    }

    const wasMarked = await deps.markEventProcessed(eventId);
    if (!wasMarked) {
      return { status: 200, body: { received: true, duplicate: true } };
    }

    try {
      const occurredAt = resolveEventOccurredAt(event, verificationHeaders.transmissionTime);
      const resource = event.resource ?? {};
      const user = await findLinkedUser(resource, deps);
      if (!user) {
        return { status: 200, body: { received: true } };
      }
      if (isStalePayPalEventForStripeSubscriber(user, resource, event.event_type)) {
        return { status: 200, body: { received: true } };
      }
      if (isOutOfOrderProviderEvent(user, occurredAt)) {
        return { status: 200, body: { received: true } };
      }

      const internalStatus = toInternalStatus(resource.status);
      const isActive = isActiveSubscriptionStatus(internalStatus);
      const cancelAtPeriodEnd = internalStatus === "canceled";
      const eventPayPalSubscriptionId =
        typeof resource.id === "string" && resource.id.length > 0 ? resource.id : null;
      const hasTrackedPayPalState =
        user.subscriptionProvider === "paypal" ||
        (Boolean(user.paypalSubscriptionId) && user.paypalSubscriptionId === eventPayPalSubscriptionId);
      if (internalStatus === "incomplete" && !hasTrackedPayPalState) {
        return { status: 200, body: { received: true } };
      }
      const planId = typeof resource.plan_id === "string" ? resource.plan_id : null;
      const supporterTier =
        internalStatus && deps.shouldGrantSupporterBadge(internalStatus)
          ? getTierFromPlanId(planId, deps.getPlanMap())
          : 0;
      const paypalSubscriptionId = typeof resource.id === "string" ? resource.id : null;
      const paypalPayerId =
        typeof resource.subscriber?.payer_id === "string" ? resource.subscriber.payer_id : null;
      const nextBillingTime = toDate(resource.billing_info?.next_billing_time);
      const hasPendingPlanChange = Boolean(user.pendingSubscriptionPriceId);
      const isPendingPlanNowActive =
        Boolean(user.pendingSubscriptionPriceId) && planId === user.pendingSubscriptionPriceId;
      const shouldPromotePendingPlan =
        isPendingPlanNowActive &&
        (event.event_type === "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED" ||
          event.event_type === "PAYMENT.SALE.COMPLETED" ||
          event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED");
      const nextSubscriptionPriceId =
        hasPendingPlanChange && !shouldPromotePendingPlan
          ? user.subscriptionPriceId
          : planId;
      const nextPendingSubscriptionPriceId =
        shouldPromotePendingPlan || !isActive ? null : user.pendingSubscriptionPriceId;
      const nextPeriodEnd = nextBillingTime ?? user.subscriptionCurrentPeriodEnd ?? null;
      const nextSupporterTier =
        internalStatus && deps.shouldGrantSupporterBadge(internalStatus)
          ? getTierFromPlanId(nextSubscriptionPriceId, deps.getPlanMap())
          : 0;
      await deps.updateUserSubscription(user.clerkUserId, {
        subscriptionProvider: "paypal",
        subscriptionProviderUpdatedAt: occurredAt ?? new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        paypalSubscriptionId,
        paypalPayerId,
        subscriptionStatus: internalStatus,
        subscriptionPriceId: nextSubscriptionPriceId,
        pendingSubscriptionPriceId: nextPendingSubscriptionPriceId,
        subscriptionCurrentPeriodEnd: nextPeriodEnd,
        subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
        supporterTier: nextSupporterTier,
      });
    } catch {
      await deps.unmarkEventProcessed(eventId);
      return { status: 500, body: { error: "Failed to process PayPal webhook event." } };
    }

    return { status: 200, body: { received: true } };
  };
