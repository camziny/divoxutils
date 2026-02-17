import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import webhookHandler from "../pages/api/clerk-webhook";

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key: string, value: unknown) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    end(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function createWebhookRequest(options?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}) {
  const method = options?.method ?? "POST";
  const headers = options?.headers ?? {};
  const body = options?.body ?? "";

  const req: any = {
    method,
    headers,
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(body, "utf8");
    },
  };

  return req;
}

function createValidSvixSignature(options: {
  secret: string;
  svixId: string;
  svixTimestamp: string;
  payload: string;
}) {
  const normalizedSecret = options.secret.startsWith("whsec_")
    ? options.secret.slice(6)
    : options.secret;
  const key = Buffer.from(normalizedSecret, "base64");
  const signedContent = `${options.svixId}.${options.svixTimestamp}.${options.payload}`;
  const signature = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");
  return `v1,${signature}`;
}

test("clerk webhook rejects missing svix headers", async () => {
  const previousSecret = process.env.CLERK_WEBHOOK_SECRET;
  process.env.CLERK_WEBHOOK_SECRET = "whsec_test_secret";

  const req = createWebhookRequest({ headers: {} });
  const res = createMockResponse();

  await webhookHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Missing Svix headers",
  });

  process.env.CLERK_WEBHOOK_SECRET = previousSecret;
});

test("clerk webhook rejects invalid svix signature", async () => {
  const previousSecret = process.env.CLERK_WEBHOOK_SECRET;
  process.env.CLERK_WEBHOOK_SECRET = "whsec_test_secret";

  const req = createWebhookRequest({
    headers: {
      "svix-id": "msg_123",
      "svix-timestamp": String(Math.floor(Date.now() / 1000)),
      "svix-signature": "v1,invalid",
    },
    body: JSON.stringify({
      type: "user.created",
      data: { id: "user_123" },
    }),
  });
  const res = createMockResponse();

  await webhookHandler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid webhook signature",
  });

  process.env.CLERK_WEBHOOK_SECRET = previousSecret;
});

test("clerk webhook accepts valid svix signature and continues payload validation", async () => {
  const previousSecret = process.env.CLERK_WEBHOOK_SECRET;
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  process.env.CLERK_WEBHOOK_SECRET = `whsec_${base64Secret}`;

  const payload = JSON.stringify({
    type: "user.updated",
    data: {
      id: "user_123",
      username: "alice",
    },
  });
  const svixId = "msg_valid_123";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: process.env.CLERK_WEBHOOK_SECRET,
    svixId,
    svixTimestamp,
    payload,
  });

  const req = createWebhookRequest({
    headers: {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    },
    body: payload,
  });
  const res = createMockResponse();

  await webhookHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Invalid clerk data" });

  process.env.CLERK_WEBHOOK_SECRET = previousSecret;
});
