import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  cancelPayPalSubscriptionHandler,
  changePayPalPlanHandler,
  createCheckoutSessionHandler,
  createPayPalSubscriptionHandler,
  createPortalSessionHandler,
} from "../src/server/api/billingRouteHandlers";
import { createPayPalWebhookHandler } from "../src/server/api/paypalWebhookRouteHandler";
import { createStripeWebhookHandler } from "../src/server/api/stripeWebhookRouteHandler";

function createHeaders(input?: Record<string, string>) {
  return new Headers(input ?? {});
}

test("create checkout session requires POST", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: async () => "user_1",
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: null,
      subscriptionStatus: null,
    }),
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const result = await handler({
    method: "GET",
    body: {},
    headers: createHeaders(),
  });
  assert.equal(result.status, 405);
});

test("create checkout session requires auth", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: async () => null,
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: null,
      subscriptionStatus: null,
    }),
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const result = await handler({
    method: "POST",
    body: { tier: 1 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 401);
});

test("create checkout session validates tier", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: async () => "user_1",
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: null,
      subscriptionStatus: null,
    }),
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const result = await handler({
    method: "POST",
    body: { tier: 10 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 400);
});

test("create checkout session returns 404 when local user missing", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: async () => "user_1",
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => null,
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const result = await handler({
    method: "POST",
    body: { tier: 1 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 404);
});

test("create checkout session returns URL on success", async () => {
  let captured: any = null;
  const handler = createCheckoutSessionHandler({
    getAuthUserId: async () => "user_1",
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: "cus_123",
      subscriptionStatus: null,
    }),
    createCheckoutSession: async (params) => {
      captured = params;
      return { url: "https://stripe.test/session" };
    },
  });

  const result = await handler({
    method: "POST",
    body: { tier: 2 },
    headers: createHeaders({ host: "example.com", "x-forwarded-proto": "https" }),
  });
  const expectedOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://example.com";
  assert.equal(result.status, 200);
  assert.equal((result.body as any).url, "https://stripe.test/session");
  assert.equal(captured.priceId, "price_2");
  assert.equal(captured.customerId, "cus_123");
  assert.equal(captured.origin, expectedOrigin);
});

test("create checkout session blocks duplicate active subscriptions", async () => {
  let createCalls = 0;
  const handler = createCheckoutSessionHandler({
    getAuthUserId: async () => "user_1",
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: "cus_123",
      subscriptionStatus: "active",
    }),
    createCheckoutSession: async () => {
      createCalls += 1;
      return { url: "https://stripe.test/session" };
    },
  });

  const result = await handler({
    method: "POST",
    body: { tier: 1 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 409);
  assert.equal(createCalls, 0);
});

test("create portal session requires auth and existing customer", async () => {
  const unauthHandler = createPortalSessionHandler({
    getAuthUserId: async () => null,
    findCustomerIdByClerkUserId: async () => "cus_1",
    createPortalSession: async () => ({ url: "https://stripe.test/portal" }),
  });

  const unauthResult = await unauthHandler({
    method: "POST",
    body: {},
    headers: createHeaders(),
  });
  assert.equal(unauthResult.status, 401);

  const missingCustomerHandler = createPortalSessionHandler({
    getAuthUserId: async () => "user_1",
    findCustomerIdByClerkUserId: async () => null,
    createPortalSession: async () => ({ url: "https://stripe.test/portal" }),
  });
  const missingResult = await missingCustomerHandler({
    method: "POST",
    body: {},
    headers: createHeaders({ host: "example.com", "x-forwarded-proto": "https" }),
  });
  assert.equal(missingResult.status, 404);
});

test("create portal session returns URL on success", async () => {
  let returnUrl = "";
  const handler = createPortalSessionHandler({
    getAuthUserId: async () => "user_1",
    findCustomerIdByClerkUserId: async () => "cus_1",
    createPortalSession: async (params) => {
      returnUrl = params.returnUrl;
      return { url: "https://stripe.test/portal" };
    },
  });

  const result = await handler({
    method: "POST",
    body: {},
    headers: createHeaders({ host: "example.com", "x-forwarded-proto": "https" }),
  });
  const expectedOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://example.com";
  assert.equal(result.status, 200);
  assert.equal((result.body as any).url, "https://stripe.test/portal");
  assert.equal(returnUrl, `${expectedOrigin}/billing`);
});

test("create paypal subscription enforces feature flag", async () => {
  let created = 0;
  const handler = createPayPalSubscriptionHandler({
    getAuthUserId: async () => "user_1",
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    isPayPalEnabled: () => false,
    findUserByClerkId: async () => ({ clerkUserId: "user_1", subscriptionStatus: null }),
    createPayPalSubscription: async () => {
      created += 1;
      return {
        id: "I-SUB",
        status: "active",
        approveUrl: "https://paypal.test",
        payerId: "payer_1",
      };
    },
    recordPayPalSubscription: async () => {},
  });
  const result = await handler({
    method: "POST",
    body: { tier: 1 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 404);
  assert.equal(created, 0);
});

test("create paypal subscription returns approval URL", async () => {
  let recorded: Record<string, unknown> | null = null;
  let receivedOrigin = "";
  const handler = createPayPalSubscriptionHandler({
    getAuthUserId: async () => "user_1",
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => ({ clerkUserId: "user_1", subscriptionStatus: null }),
    createPayPalSubscription: async (params) => {
      receivedOrigin = params.origin;
      return {
        id: "I-SUB",
        status: "incomplete",
        approveUrl: "https://paypal.test/approve",
        payerId: "payer_1",
      };
    },
    recordPayPalSubscription: async (params) => {
      recorded = params as unknown as Record<string, unknown>;
    },
  });

  const result = await handler({
    method: "POST",
    body: { tier: 2 },
    headers: createHeaders({ host: "example.com", "x-forwarded-proto": "https" }),
  });
  const expectedOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://example.com";
  assert.equal(result.status, 200);
  assert.equal((result.body as { url: string }).url, "https://paypal.test/approve");
  assert.equal(receivedOrigin, expectedOrigin);
  assert.equal(recorded?.["subscriptionPriceId"], "plan_2");
});

test("create paypal subscription blocks duplicate active subscriptions", async () => {
  let created = 0;
  const handler = createPayPalSubscriptionHandler({
    getAuthUserId: async () => "user_1",
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => ({ clerkUserId: "user_1", subscriptionStatus: "active" }),
    createPayPalSubscription: async () => {
      created += 1;
      return {
        id: "I-SUB",
        status: "active",
        approveUrl: "https://paypal.test/approve",
        payerId: "payer_1",
      };
    },
    recordPayPalSubscription: async () => {},
  });

  const result = await handler({
    method: "POST",
    body: { tier: 2 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 409);
  assert.equal(created, 0);
});

test("cancel paypal subscription marks cancel at period end without dropping tier", async () => {
  let cancelCalls = 0;
  let capturedUpdateClerkUserId = "";
  const handler = cancelPayPalSubscriptionHandler({
    getAuthUserId: async () => "user_1",
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      subscriptionProvider: "paypal",
      paypalSubscriptionId: "I-SUB-1",
    }),
    cancelPayPalSubscription: async ({ paypalSubscriptionId, reason }) => {
      cancelCalls += 1;
      assert.equal(paypalSubscriptionId, "I-SUB-1");
      assert.equal(reason, "User requested cancellation.");
    },
    markPayPalSubscriptionCancelAtPeriodEnd: async ({ clerkUserId }) => {
      capturedUpdateClerkUserId = clerkUserId;
    },
  });

  const result = await handler({
    method: "POST",
    body: null,
    headers: createHeaders({ host: "example.com", "x-forwarded-proto": "https" }),
  });

  const expectedOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://example.com";
  assert.equal(result.status, 200);
  assert.equal((result.body as { url: string }).url, `${expectedOrigin}/billing`);
  assert.equal(cancelCalls, 1);
  assert.equal(capturedUpdateClerkUserId, "user_1");
});

test("cancel paypal subscription rejects unsupported states", async () => {
  let cancelCalls = 0;
  const handler = cancelPayPalSubscriptionHandler({
    getAuthUserId: async () => "user_1",
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      subscriptionProvider: "stripe",
      paypalSubscriptionId: "I-SUB-1",
    }),
    cancelPayPalSubscription: async () => {
      cancelCalls += 1;
    },
    markPayPalSubscriptionCancelAtPeriodEnd: async () => {},
  });

  const result = await handler({
    method: "POST",
    body: null,
    headers: createHeaders(),
  });

  assert.equal(result.status, 404);
  assert.equal(cancelCalls, 0);
});

test("cancel paypal subscription enforces method, feature flag, and auth", async () => {
  const handler = cancelPayPalSubscriptionHandler({
    getAuthUserId: async () => null,
    isPayPalEnabled: () => false,
    findUserByClerkId: async () => null,
    cancelPayPalSubscription: async () => {},
    markPayPalSubscriptionCancelAtPeriodEnd: async () => {},
  });

  const methodResult = await handler({
    method: "GET",
    body: null,
    headers: createHeaders(),
  });
  assert.equal(methodResult.status, 405);

  const featureResult = await handler({
    method: "POST",
    body: null,
    headers: createHeaders(),
  });
  assert.equal(featureResult.status, 404);

  const authHandler = cancelPayPalSubscriptionHandler({
    getAuthUserId: async () => null,
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => null,
    cancelPayPalSubscription: async () => {},
    markPayPalSubscriptionCancelAtPeriodEnd: async () => {},
  });
  const authResult = await authHandler({
    method: "POST",
    body: null,
    headers: createHeaders(),
  });
  assert.equal(authResult.status, 401);
});

test("change paypal plan schedules pending tier and returns approval url", async () => {
  let revisedPlanId = "";
  let updatedPendingPlanId = "";
  const handler = changePayPalPlanHandler({
    getAuthUserId: async () => "user_1",
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      subscriptionProvider: "paypal",
      subscriptionStatus: "active",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
      paypalSubscriptionId: "I-SUB",
    }),
    revisePayPalSubscriptionPlan: async ({ planId }) => {
      revisedPlanId = planId;
      return { approveUrl: "https://paypal.test/reapprove" };
    },
    updatePendingSubscriptionPriceId: async ({ pendingSubscriptionPriceId }) => {
      updatedPendingPlanId = pendingSubscriptionPriceId;
    },
  });
  const result = await handler({
    method: "POST",
    body: { tier: 3 },
    headers: createHeaders({ host: "example.com", "x-forwarded-proto": "https" }),
  });
  assert.equal(result.status, 200);
  assert.equal((result.body as { url: string }).url, "https://paypal.test/reapprove");
  assert.equal(revisedPlanId, "plan_3");
  assert.equal(updatedPendingPlanId, "plan_3");
});

test("change paypal plan rejects duplicate pending tier", async () => {
  const handler = changePayPalPlanHandler({
    getAuthUserId: async () => "user_1",
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    isPayPalEnabled: () => true,
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      subscriptionProvider: "paypal",
      subscriptionStatus: "active",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: "plan_3",
      paypalSubscriptionId: "I-SUB",
    }),
    revisePayPalSubscriptionPlan: async () => ({ approveUrl: null }),
    updatePendingSubscriptionPriceId: async () => {},
  });

  const result = await handler({
    method: "POST",
    body: { tier: 3 },
    headers: createHeaders(),
  });
  assert.equal(result.status, 409);
});

const subscriptionEvent = (overrides?: Partial<Stripe.Subscription>): Stripe.Event =>
  ({
    id: "evt_sub",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_1",
        object: "subscription",
        customer: "cus_1",
        status: "active",
        cancel_at_period_end: false,
        current_period_end: 2000000000,
        metadata: {},
        items: {
          object: "list",
          data: [
            {
              id: "si_1",
              object: "subscription_item",
              current_period_start: 1900000000,
              current_period_end: 2000000000,
              price: { id: "price_3" },
            },
          ],
          has_more: false,
          url: "/",
        },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event);

test("stripe webhook validates signature and method", async () => {
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => subscriptionEvent(),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => null,
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {},
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const wrongMethodResult = await handler({
    method: "GET",
    signature: null,
    rawBody: Buffer.from("{}"),
  });
  assert.equal(wrongMethodResult.status, 405);

  const missingSigResult = await handler({
    method: "POST",
    signature: null,
    rawBody: Buffer.from("{}"),
  });
  assert.equal(missingSigResult.status, 400);
});

test("stripe webhook handles invalid signature", async () => {
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => {
      throw new Error("bad signature");
    },
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => null,
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {},
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 401);
});

test("stripe webhook short-circuits duplicate events", async () => {
  let updateCalls = 0;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => subscriptionEvent(),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => false,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({ clerkUserId: "user_1" }),
    findUserByStripeCustomerId: async () => ({ clerkUserId: "user_1" }),
    updateUserSubscription: async () => {
      updateCalls += 1;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { received: true, duplicate: true });
  assert.equal(updateCalls, 0);
});

test("stripe webhook syncs active subscription tier and period", async () => {
  let updated: any = null;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () =>
      subscriptionEvent({
        status: "active",
        cancel_at_period_end: true,
      }),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => null,
    findUserByStripeCustomerId: async () => ({ clerkUserId: "user_1" }),
    updateUserSubscription: async (_clerkUserId, data) => {
      updated = data;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updated.supporterTier, 3);
  assert.equal(updated.subscriptionStatus, "active");
  assert.equal(updated.subscriptionCancelAtPeriodEnd, true);
  assert.equal(updated.subscriptionPriceId, "price_3");
  assert.ok(updated.subscriptionCurrentPeriodEnd instanceof Date);
});

test("stripe webhook clears badge for inactive status", async () => {
  let updatedTier = -1;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () =>
      subscriptionEvent({
        status: "canceled",
      }),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => null,
    findUserByStripeCustomerId: async () => ({ clerkUserId: "user_1" }),
    updateUserSubscription: async (_clerkUserId, data) => {
      updatedTier = data.supporterTier ?? -1;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: (status) => status === "active",
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updatedTier, 0);
});

test("stripe webhook links checkout completion by clerk metadata", async () => {
  let updatedData: any = null;
  const event = {
    id: "evt_checkout",
    type: "checkout.session.completed",
    data: {
      object: {
        mode: "subscription",
        metadata: { clerkUserId: "user_2" },
        client_reference_id: "user_2",
        customer: "cus_2",
        subscription: "sub_2",
      },
    },
  } as unknown as Stripe.Event;

  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => event,
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({ clerkUserId: "user_2" }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async (_clerkUserId, data) => {
      updatedData = data;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updatedData.stripeCustomerId, "cus_2");
  assert.equal(updatedData.stripeSubscriptionId, "sub_2");
  assert.equal(updatedData.paypalPayerId, null);
  assert.equal(updatedData.paypalSubscriptionId, null);
  assert.equal(updatedData.pendingSubscriptionPriceId, null);
});

test("stripe webhook links checkout completion with tier metadata present", async () => {
  let updatedData: any = null;
  const event = {
    id: "evt_checkout_tier",
    type: "checkout.session.completed",
    data: {
      object: {
        mode: "subscription",
        metadata: { clerkUserId: "user_3", tier: "2" },
        client_reference_id: "user_3",
        customer: "cus_3",
        subscription: "sub_3",
      },
    },
  } as unknown as Stripe.Event;

  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => event,
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_3",
    }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async (_clerkUserId, data) => {
      updatedData = data;
    },
    extractRecurringPriceId: () => "price_2",
    getTierFromPriceId: () => 2,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updatedData.stripeCustomerId, "cus_3");
  assert.equal(updatedData.stripeSubscriptionId, "sub_3");
  assert.equal(updatedData.paypalPayerId, null);
  assert.equal(updatedData.paypalSubscriptionId, null);
  assert.equal(updatedData.pendingSubscriptionPriceId, null);
});

test("stripe webhook ignores stale subscription events when user is on PayPal", async () => {
  let updateCalls = 0;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () =>
      subscriptionEvent({
        id: "sub_stale",
        status: "canceled",
      }),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_pp",
      subscriptionProvider: "paypal",
      stripeSubscriptionId: null,
      paypalSubscriptionId: "I-ACTIVE",
    }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {
      updateCalls += 1;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => false,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updateCalls, 0);
});

test("stripe webhook ignores subscription events when provider is PayPal and Stripe id is untracked", async () => {
  let updateCalls = 0;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () =>
      subscriptionEvent({
        id: "sub_orphaned",
        status: "active",
        metadata: { clerkUserId: "user_pp_only" },
      }),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_pp_only",
      subscriptionProvider: "paypal",
      stripeSubscriptionId: null,
      paypalSubscriptionId: null,
    }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {
      updateCalls += 1;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updateCalls, 0);
});

test("stripe webhook ignores out-of-order events by provider timestamp", async () => {
  let updateCalls = 0;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () =>
      ({
        ...subscriptionEvent({
          id: "sub_older",
          status: "active",
          metadata: { clerkUserId: "user_ordered" },
        }),
        created: 1_700_000_000,
      }) as Stripe.Event,
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_ordered",
      subscriptionProvider: "stripe",
      subscriptionProviderUpdatedAt: new Date("2026-04-20T20:00:00Z"),
      stripeSubscriptionId: "sub_older",
      paypalSubscriptionId: null,
    }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {
      updateCalls += 1;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updateCalls, 0);
});

test("stripe webhook applies subscription sync when tracked Stripe subscription matches", async () => {
  let updated: any = null;
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () =>
      subscriptionEvent({
        id: "sub_tracked",
        status: "active",
        metadata: { clerkUserId: "user_mixed" },
      }),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_mixed",
      subscriptionProvider: "stripe",
      stripeSubscriptionId: "sub_tracked",
      paypalSubscriptionId: "I-OLD",
    }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async (_id, data) => {
      updated = data;
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 200);
  assert.equal(updated.paypalSubscriptionId, null);
  assert.equal(updated.supporterTier, 3);
});

test("stripe webhook unmarks event when processing fails", async () => {
  const unmarked: string[] = [];
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => subscriptionEvent(),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async (eventId) => {
      unmarked.push(eventId);
    },
    findUserByClerkUserId: async () => null,
    findUserByStripeCustomerId: async () => ({ clerkUserId: "user_1" }),
    updateUserSubscription: async () => {
      throw new Error("write failed");
    },
    extractRecurringPriceId: () => "price_3",
    getTierFromPriceId: () => 3,
    shouldGrantSupporterBadge: () => true,
  });

  const result = await handler({
    method: "POST",
    signature: "sig",
    rawBody: Buffer.from("{}"),
  });
  assert.equal(result.status, 500);
  assert.deepEqual(unmarked, ["evt_sub"]);
});

test("paypal webhook validates method and headers", async () => {
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: () => true,
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalSubscriptionId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalPayerId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    updateUserSubscription: async () => {},
  });

  const wrongMethod = await handler({
    method: "GET",
    headers: createHeaders(),
    body: {},
  });
  assert.equal(wrongMethod.status, 405);

  const missingHeaders = await handler({
    method: "POST",
    headers: createHeaders(),
    body: {},
  });
  assert.equal(missingHeaders.status, 400);
});

test("paypal webhook short-circuits duplicates", async () => {
  let updated = 0;
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => false,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: () => true,
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalSubscriptionId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalPayerId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    updateUserSubscription: async () => {
      updated += 1;
    },
  });

  const result = await handler({
    method: "POST",
    headers: createHeaders({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "time",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "algo",
    }),
    body: {
      id: "evt_1",
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: "I-SUB",
        status: "ACTIVE",
        custom_id: "user_1",
        plan_id: "plan_2",
      },
    },
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { received: true, duplicate: true });
  assert.equal(updated, 0);
});

test("paypal webhook updates subscription state", async () => {
  let updatedData: Record<string, unknown> | null = null;
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: (status) => status === "active",
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalSubscriptionId: async () => null,
    findUserByPayPalPayerId: async () => null,
    updateUserSubscription: async (_clerkUserId, data) => {
      updatedData = data as unknown as Record<string, unknown>;
    },
  });

  const result = await handler({
    method: "POST",
    headers: createHeaders({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "time",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "algo",
    }),
    body: {
      id: "evt_1",
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: "I-SUB",
        status: "ACTIVE",
        custom_id: "user_1",
        plan_id: "plan_3",
        subscriber: {
          payer_id: "payer_123",
        },
        billing_info: {
          next_billing_time: "2026-05-01T00:00:00Z",
        },
      },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(updatedData?.["subscriptionProvider"], "paypal");
  assert.equal(updatedData?.["subscriptionStatus"], "active");
  assert.equal(updatedData?.["subscriptionPriceId"], "plan_3");
  assert.equal(updatedData?.["subscriptionCancelAtPeriodEnd"], false);
  assert.equal(updatedData?.["supporterTier"], 3);
});

test("paypal webhook does not mark approval-pending subscription as canceling", async () => {
  let updatedData: Record<string, unknown> | null = null;
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: (status) => status === "active",
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalSubscriptionId: async () => null,
    findUserByPayPalPayerId: async () => null,
    updateUserSubscription: async (_clerkUserId, data) => {
      updatedData = data as unknown as Record<string, unknown>;
    },
  });

  const result = await handler({
    method: "POST",
    headers: createHeaders({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "time",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "algo",
    }),
    body: {
      id: "evt_approval_pending",
      event_type: "BILLING.SUBSCRIPTION.CREATED",
      resource: {
        id: "I-SUB-PENDING",
        status: "APPROVAL_PENDING",
        custom_id: "user_1",
        plan_id: "plan_1",
      },
    },
  });

  assert.equal(result.status, 200);
  assert.equal(updatedData?.["subscriptionStatus"], "incomplete");
  assert.equal(updatedData?.["subscriptionCancelAtPeriodEnd"], false);
});

test("paypal webhook preserves existing period end when next billing time is missing", async () => {
  let updatedData: Record<string, unknown> | null = null;
  const existingPeriodEnd = new Date("2026-05-01T00:00:00Z");
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: (status) => status === "active",
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
      subscriptionCurrentPeriodEnd: existingPeriodEnd,
    }),
    findUserByPayPalSubscriptionId: async () => null,
    findUserByPayPalPayerId: async () => null,
    updateUserSubscription: async (_clerkUserId, data) => {
      updatedData = data as unknown as Record<string, unknown>;
    },
  });

  const result = await handler({
    method: "POST",
    headers: createHeaders({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "time",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "algo",
    }),
    body: {
      id: "evt_2",
      event_type: "BILLING.SUBSCRIPTION.CANCELLED",
      resource: {
        id: "I-SUB",
        status: "CANCELLED",
        custom_id: "user_1",
        plan_id: "plan_1",
        subscriber: {
          payer_id: "payer_123",
        },
      },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(updatedData?.["subscriptionStatus"], "canceled");
  assert.equal(updatedData?.["subscriptionCancelAtPeriodEnd"], true);
  assert.deepEqual(updatedData?.["subscriptionCurrentPeriodEnd"], existingPeriodEnd);
});

test("paypal webhook ignores stale events when user is on Stripe", async () => {
  let updated = 0;
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: () => true,
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionProvider: "stripe",
      stripeSubscriptionId: "sub_live",
      paypalSubscriptionId: null,
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalSubscriptionId: async () => null,
    findUserByPayPalPayerId: async () => null,
    updateUserSubscription: async () => {
      updated += 1;
    },
  });

  const result = await handler({
    method: "POST",
    headers: createHeaders({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "time",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "algo",
    }),
    body: {
      id: "evt_3",
      event_type: "BILLING.SUBSCRIPTION.UPDATED",
      resource: {
        id: "I-OLD",
        status: "ACTIVE",
        custom_id: "user_1",
        plan_id: "plan_2",
      },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(updated, 0);
});

test("paypal webhook ordering prefers event create_time over transmission time", async () => {
  let updated = 0;
  const handler = createPayPalWebhookHandler({
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    verifyWebhook: async () => true,
    getPlanMap: () => ({ 1: "plan_1", 2: "plan_2", 3: "plan_3" }),
    shouldGrantSupporterBadge: () => true,
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_1",
      subscriptionProvider: "paypal",
      subscriptionProviderUpdatedAt: new Date("2026-04-20T20:00:00Z"),
      stripeSubscriptionId: null,
      paypalSubscriptionId: "I-SUB-LIVE",
      subscriptionPriceId: "plan_1",
      pendingSubscriptionPriceId: null,
    }),
    findUserByPayPalSubscriptionId: async () => null,
    findUserByPayPalPayerId: async () => null,
    updateUserSubscription: async () => {
      updated += 1;
    },
  });

  const result = await handler({
    method: "POST",
    headers: createHeaders({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "2026-04-20T22:00:00Z",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "algo",
    }),
    body: {
      id: "evt_4",
      create_time: "2026-04-20T19:00:00Z",
      event_type: "BILLING.SUBSCRIPTION.UPDATED",
      resource: {
        id: "I-SUB-LIVE",
        status: "ACTIVE",
        custom_id: "user_1",
        plan_id: "plan_2",
      },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(updated, 0);
});
