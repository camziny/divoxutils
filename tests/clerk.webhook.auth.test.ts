import test from "node:test";
import assert from "node:assert/strict";
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
