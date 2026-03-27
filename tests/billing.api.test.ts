import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { createCheckoutSessionHandler } from "../pages/api/billing/create-checkout-session";
import { createPortalSessionHandler } from "../pages/api/billing/create-portal-session";
import { createStripeWebhookHandler } from "../pages/api/stripe/webhook";

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function createMockRequest(options?: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  return {
    method: options?.method ?? "POST",
    body: options?.body ?? {},
    headers: options?.headers ?? {},
  } as any;
}

test("create checkout session requires POST", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: () => "user_1",
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: null,
      subscriptionStatus: null,
    }),
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});

test("create checkout session requires auth", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: () => null,
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: null,
      subscriptionStatus: null,
    }),
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const req = createMockRequest({ body: { tier: 1 } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
});

test("create checkout session validates tier", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: () => "user_1",
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => ({
      clerkUserId: "user_1",
      stripeCustomerId: null,
      subscriptionStatus: null,
    }),
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const req = createMockRequest({ body: { tier: 10 } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test("create checkout session returns 404 when local user missing", async () => {
  const handler = createCheckoutSessionHandler({
    getAuthUserId: () => "user_1",
    getPriceMap: () => ({ 1: "p1", 2: "p2", 3: "p3" }),
    findUserByClerkId: async () => null,
    createCheckoutSession: async () => ({ url: "https://example.com" }),
  });

  const req = createMockRequest({ body: { tier: 1 } });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 404);
});

test("create checkout session returns URL on success", async () => {
  let captured: any = null;
  const handler = createCheckoutSessionHandler({
    getAuthUserId: () => "user_1",
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

  const req = createMockRequest({
    body: { tier: 2 },
    headers: { host: "example.com", "x-forwarded-proto": "https" },
  });
  const res = createMockResponse();
  await handler(req, res);

  const expectedOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://example.com";
  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).url, "https://stripe.test/session");
  assert.equal(captured.priceId, "price_2");
  assert.equal(captured.customerId, "cus_123");
  assert.equal(captured.origin, expectedOrigin);
});

test("create checkout session blocks duplicate active subscriptions", async () => {
  let createCalls = 0;
  const handler = createCheckoutSessionHandler({
    getAuthUserId: () => "user_1",
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

  const req = createMockRequest({ body: { tier: 1 } });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(createCalls, 0);
});

test("create portal session requires auth and existing customer", async () => {
  const unauthHandler = createPortalSessionHandler({
    getAuthUserId: () => null,
    findCustomerIdByClerkUserId: async () => "cus_1",
    createPortalSession: async () => ({ url: "https://stripe.test/portal" }),
  });

  const unauthReq = createMockRequest({ body: {} });
  const unauthRes = createMockResponse();
  await unauthHandler(unauthReq, unauthRes);
  assert.equal(unauthRes.statusCode, 401);

  const missingCustomerHandler = createPortalSessionHandler({
    getAuthUserId: () => "user_1",
    findCustomerIdByClerkUserId: async () => null,
    createPortalSession: async () => ({ url: "https://stripe.test/portal" }),
  });
  const missingReq = createMockRequest({
    headers: { host: "example.com", "x-forwarded-proto": "https" },
  });
  const missingRes = createMockResponse();
  await missingCustomerHandler(missingReq, missingRes);
  assert.equal(missingRes.statusCode, 404);
});

test("create portal session returns URL on success", async () => {
  let returnUrl = "";
  const handler = createPortalSessionHandler({
    getAuthUserId: () => "user_1",
    findCustomerIdByClerkUserId: async () => "cus_1",
    createPortalSession: async (params) => {
      returnUrl = params.returnUrl;
      return { url: "https://stripe.test/portal" };
    },
  });

  const req = createMockRequest({
    headers: { host: "example.com", "x-forwarded-proto": "https" },
  });
  const res = createMockResponse();
  await handler(req, res);

  const expectedOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://example.com";
  assert.equal(res.statusCode, 200);
  assert.equal((res.body as any).url, "https://stripe.test/portal");
  assert.equal(returnUrl, `${expectedOrigin}/billing`);
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
    readRequestBody: async () => Buffer.from("{}"),
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => subscriptionEvent(),
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => null,
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {},
    sendSupporterThankYouEmail: async () => {},
  });

  const wrongMethodReq = createMockRequest({ method: "GET" });
  const wrongMethodRes = createMockResponse();
  await handler(wrongMethodReq, wrongMethodRes);
  assert.equal(wrongMethodRes.statusCode, 405);

  const missingSigReq = createMockRequest({ method: "POST" });
  const missingSigRes = createMockResponse();
  await handler(missingSigReq, missingSigRes);
  assert.equal(missingSigRes.statusCode, 400);
});

test("stripe webhook handles invalid signature", async () => {
  const handler = createStripeWebhookHandler({
    readRequestBody: async () => Buffer.from("{}"),
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
    sendSupporterThankYouEmail: async () => {},
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
});

test("stripe webhook short-circuits duplicate events", async () => {
  let updateCalls = 0;
  const handler = createStripeWebhookHandler({
    readRequestBody: async () => Buffer.from("{}"),
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
    sendSupporterThankYouEmail: async () => {},
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { received: true, duplicate: true });
  assert.equal(updateCalls, 0);
});

test("stripe webhook syncs active subscription tier and period", async () => {
  let updated: any = null;
  let emailCalls = 0;
  const handler = createStripeWebhookHandler({
    readRequestBody: async () => Buffer.from("{}"),
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
    sendSupporterThankYouEmail: async () => {
      emailCalls += 1;
    },
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(updated.supporterTier, 3);
  assert.equal(updated.subscriptionStatus, "active");
  assert.equal(updated.subscriptionCancelAtPeriodEnd, true);
  assert.equal(updated.subscriptionPriceId, "price_3");
  assert.ok(updated.subscriptionCurrentPeriodEnd instanceof Date);
  assert.equal(emailCalls, 0);
});

test("stripe webhook clears badge for inactive status", async () => {
  let updatedTier = -1;
  const handler = createStripeWebhookHandler({
    readRequestBody: async () => Buffer.from("{}"),
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
    sendSupporterThankYouEmail: async () => {},
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(updatedTier, 0);
});

test("stripe webhook links checkout completion by clerk metadata", async () => {
  let updatedData: any = null;
  let sentEmail: any = null;
  let emailCalls = 0;
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
    readRequestBody: async () => Buffer.from("{}"),
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
    sendSupporterThankYouEmail: async (params) => {
      emailCalls += 1;
      sentEmail = params;
    },
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(updatedData.stripeCustomerId, "cus_2");
  assert.equal(updatedData.stripeSubscriptionId, "sub_2");
  assert.equal(emailCalls, 1);
  assert.equal(sentEmail.email, undefined);
  assert.equal(sentEmail.tier, 0);
});

test("stripe webhook sends thank-you email with tier from checkout metadata", async () => {
  let emailCalls = 0;
  let sentEmail: any = null;
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
    readRequestBody: async () => Buffer.from("{}"),
    getWebhookSecret: () => "whsec_test",
    constructEvent: () => event,
    getPriceMap: () => ({ 1: "price_1", 2: "price_2", 3: "price_3" }),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
    findUserByClerkUserId: async () => ({
      clerkUserId: "user_3",
      email: "user3@example.com",
      name: "User Three",
    }),
    findUserByStripeCustomerId: async () => null,
    updateUserSubscription: async () => {},
    sendSupporterThankYouEmail: async (params) => {
      emailCalls += 1;
      sentEmail = params;
    },
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(emailCalls, 1);
  assert.equal(sentEmail.email, "user3@example.com");
  assert.equal(sentEmail.name, "User Three");
  assert.equal(sentEmail.tier, 2);
});

test("stripe webhook unmarks event when processing fails", async () => {
  const unmarked: string[] = [];
  const handler = createStripeWebhookHandler({
    readRequestBody: async () => Buffer.from("{}"),
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
    sendSupporterThankYouEmail: async () => {},
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(unmarked, ["evt_sub"]);
});
