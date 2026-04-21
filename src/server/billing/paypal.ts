const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const PAYPAL_STATUS_TO_INTERNAL: Record<string, string> = {
  ACTIVE: "active",
  SUSPENDED: "past_due",
  CANCELLED: "canceled",
  EXPIRED: "canceled",
  APPROVAL_PENDING: "incomplete",
  APPROVED: "incomplete",
};

export type PayPalSubscription = {
  id: string;
  status: string | null;
  planId: string | null;
  payerId: string | null;
  nextBillingTime: string | null;
  cancelAtPeriodEnd: boolean;
  approveUrl: string | null;
  manageUrl: string | null;
};

type PayPalAccessTokenResponse = {
  access_token: string;
};

type PayPalCreateSubscriptionResponse = {
  id: string;
  status?: string;
  plan_id?: string;
  subscriber?: {
    payer_id?: string;
  };
  billing_info?: {
    next_billing_time?: string;
  };
  links?: Array<{
    rel?: string;
    href?: string;
  }>;
};

type PayPalWebhookVerificationResponse = {
  verification_status?: string;
};

const getPayPalBaseUrl = (): string => {
  const explicitBaseUrl = process.env.PAYPAL_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }
  const mode = (process.env.PAYPAL_ENV ?? "live").toLowerCase();
  if (mode === "sandbox") {
    return "https://api-m.sandbox.paypal.com";
  }
  return "https://api-m.paypal.com";
};

export const isPayPalSubscriptionsEnabled = (): boolean =>
  process.env.PAYPAL_SUBSCRIPTIONS_ENABLED === "true";

export const getPayPalWebhookId = (): string => requiredEnv("PAYPAL_WEBHOOK_ID");

export const getPayPalPlanMap = (): Record<number, string> => ({
  1: requiredEnv("PAYPAL_PLAN_ID_TIER_1"),
  2: requiredEnv("PAYPAL_PLAN_ID_TIER_2"),
  3: requiredEnv("PAYPAL_PLAN_ID_TIER_3"),
});

const parseLink = (
  links: Array<{ rel?: string; href?: string }> | undefined,
  rel: string
): string | null => {
  const link = links?.find((entry) => entry.rel === rel);
  return typeof link?.href === "string" ? link.href : null;
};

const toInternalStatus = (paypalStatus: string | null | undefined): string | null => {
  if (!paypalStatus) return null;
  return PAYPAL_STATUS_TO_INTERNAL[paypalStatus] ?? paypalStatus.toLowerCase();
};

const toPayPalSubscription = (
  payload: PayPalCreateSubscriptionResponse,
  fallbackPlanId: string | null
): PayPalSubscription => ({
  id: payload.id,
  status: toInternalStatus(payload.status),
  planId: payload.plan_id ?? fallbackPlanId,
  payerId: payload.subscriber?.payer_id ?? null,
  nextBillingTime: payload.billing_info?.next_billing_time ?? null,
  cancelAtPeriodEnd: payload.status === "CANCELLED" || payload.status === "EXPIRED",
  approveUrl: parseLink(payload.links, "approve"),
  manageUrl: parseLink(payload.links, "self"),
});

const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = requiredEnv("PAYPAL_CLIENT_ID");
  const clientSecret = requiredEnv("PAYPAL_CLIENT_SECRET");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    throw new Error(`PayPal auth failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as PayPalAccessTokenResponse;
  if (!payload.access_token) {
    throw new Error("PayPal auth response missing access token.");
  }
  return payload.access_token;
};

export const createPayPalSubscription = async (params: {
  planId: string;
  clerkUserId: string;
  tier: number;
  origin: string;
}): Promise<PayPalSubscription> => {
  const accessToken = await getPayPalAccessToken();
  const billingReturnSessionId = `pp_${params.clerkUserId}_${Date.now()}`;
  const response = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `divoxutils-${params.clerkUserId}-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: params.planId,
      custom_id: params.clerkUserId,
      application_context: {
        brand_name: "divoxutils",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${params.origin}/billing?checkout=success&provider=paypal&session_id=${encodeURIComponent(billingReturnSessionId)}`,
        cancel_url: `${params.origin}/billing?checkout=cancel&provider=paypal&session_id=${encodeURIComponent(billingReturnSessionId)}`,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`PayPal subscription creation failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as PayPalCreateSubscriptionResponse;
  if (!payload.id) {
    throw new Error("PayPal subscription creation did not return an id.");
  }
  return toPayPalSubscription(payload, params.planId);
};

export const fetchPayPalSubscription = async (
  paypalSubscriptionId: string
): Promise<PayPalSubscription> => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/billing/subscriptions/${paypalSubscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`PayPal subscription lookup failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as PayPalCreateSubscriptionResponse;
  if (!payload.id) {
    throw new Error("PayPal subscription lookup did not return an id.");
  }
  return toPayPalSubscription(payload, payload.plan_id ?? null);
};

export const cancelPayPalSubscription = async (
  paypalSubscriptionId: string,
  reason: string
): Promise<void> => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/billing/subscriptions/${paypalSubscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );
  if (!response.ok) {
    throw new Error(`PayPal subscription cancel failed with status ${response.status}.`);
  }
};

export const revisePayPalSubscriptionPlan = async (params: {
  paypalSubscriptionId: string;
  planId: string;
  origin: string;
}): Promise<{ approveUrl: string | null }> => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/billing/subscriptions/${params.paypalSubscriptionId}/revise`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: params.planId,
        application_context: {
          brand_name: "divoxutils",
          return_url: `${params.origin}/billing?switch=scheduled&provider=paypal`,
          cancel_url: `${params.origin}/billing?switch=cancel&provider=paypal`,
        },
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`PayPal subscription revise failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as {
    links?: Array<{ rel?: string; href?: string }>;
  };
  return {
    approveUrl: parseLink(payload.links, "approve"),
  };
};

export const verifyPayPalWebhook = async (params: {
  transmissionId: string;
  transmissionTime: string;
  transmissionSig: string;
  certUrl: string;
  authAlgo: string;
  webhookEvent: Record<string, unknown>;
}): Promise<boolean> => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: params.authAlgo,
      cert_url: params.certUrl,
      transmission_id: params.transmissionId,
      transmission_sig: params.transmissionSig,
      transmission_time: params.transmissionTime,
      webhook_id: getPayPalWebhookId(),
      webhook_event: params.webhookEvent,
    }),
  });
  if (!response.ok) {
    throw new Error(`PayPal webhook verification failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as PayPalWebhookVerificationResponse;
  return payload.verification_status === "SUCCESS";
};
