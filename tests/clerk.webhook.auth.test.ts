import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { createClerkWebhookHandler } from "../src/server/api/clerkWebhookRouteHandler";

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

function createNoopDeps() {
  return {
    deleteLocalUserByClerkId: async (_clerkUserId: string) => {},
    findLocalUserByClerkId: async (_clerkUserId: string) => null,
    updateLocalUsername: async (
      _clerkUserId: string,
      _username: string | null
    ) => {},
    createLocalUserFromClerk: async (_userData: {
      email: string;
      name?: string | null;
      clerkUserId: string;
    }) => ({}),
  };
}

test("clerk webhook rejects missing svix headers", async () => {
  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

  const result = await handler({
    method: "POST",
    svixId: null,
    svixTimestamp: null,
    svixSignature: null,
    rawBody: "",
    webhookSecret: "whsec_test_secret",
  });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    success: false,
    message: "Missing Svix headers",
  });
});

test("clerk webhook rejects invalid svix signature", async () => {
  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

  const result = await handler({
    method: "POST",
    svixId: "msg_123",
    svixTimestamp: String(Math.floor(Date.now() / 1000)),
    svixSignature: "v1,invalid",
    rawBody: JSON.stringify({
      type: "user.created",
      data: { id: "user_123" },
    }),
    webhookSecret: "whsec_test_secret",
  });
  assert.equal(result.status, 401);
  assert.deepEqual(result.body, {
    success: false,
    message: "Invalid webhook signature",
  });
});

test("clerk webhook accepts valid svix signature and continues payload validation", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;
  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

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
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const result = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: "Invalid clerk data" });
});

test("clerk webhook does not mark dedup for validation failures", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;
  let markCalls = 0;
  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    markEventProcessed: async () => {
      markCalls += 1;
      return true;
    },
    unmarkEventProcessed: async () => {},
  });

  const payload = JSON.stringify({
    type: "user.updated",
    data: {
      id: "user_123",
      username: "alice",
    },
  });
  const svixId = "msg_invalid_payload_123";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const first = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });
  const second = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });

  assert.equal(first.status, 400);
  assert.equal(second.status, 400);
  assert.deepEqual(first.body, { error: "Invalid clerk data" });
  assert.deepEqual(second.body, { error: "Invalid clerk data" });
  assert.equal(markCalls, 0);
});

test("clerk webhook user.deleted deletes local records via dependency", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;

  let deletedClerkUserId = "";
  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    deleteLocalUserByClerkId: async (clerkUserId: string) => {
      deletedClerkUserId = clerkUserId;
    },
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

  const payload = JSON.stringify({
    type: "user.deleted",
    data: {
      id: "user_delete_123",
    },
  });
  const svixId = "msg_delete_123";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const result = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });
  assert.equal(deletedClerkUserId, "user_delete_123");
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    success: true,
    message: "User deleted successfully",
  });
});

test("clerk webhook user.deleted returns 500 if local deletion fails", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;

  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    deleteLocalUserByClerkId: async () => {
      throw new Error("db failure");
    },
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

  const payload = JSON.stringify({
    type: "user.deleted",
    data: {
      id: "user_delete_456",
    },
  });
  const svixId = "msg_delete_456";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const result = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, {
    success: false,
    message: "Error in deleting user",
  });
});

test("clerk webhook user.deleted clears linked identity ownership state", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;

  const ownerByDiscordId = new Map<string, string>([
    ["discord_123", "user_old"],
    ["discord_999", "other_user"],
  ]);

  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    deleteLocalUserByClerkId: async (clerkUserId: string) => {
      for (const [discordUserId, owner] of Array.from(ownerByDiscordId.entries())) {
        if (owner === clerkUserId) {
          ownerByDiscordId.delete(discordUserId);
        }
      }
    },
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

  const payload = JSON.stringify({
    type: "user.deleted",
    data: {
      id: "user_old",
    },
  });
  const svixId = "msg_delete_cleanup_123";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const result = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });
  assert.equal(result.status, 200);
  assert.equal(ownerByDiscordId.has("discord_123"), false);
  assert.equal(ownerByDiscordId.get("discord_999"), "other_user");
});

test("clerk webhook ignores duplicate svix id", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;
  let createCalls = 0;
  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    createLocalUserFromClerk: async () => {
      createCalls += 1;
      return {};
    },
    markEventProcessed: async () => false,
    unmarkEventProcessed: async () => {},
  });

  const payload = JSON.stringify({
    type: "user.created",
    data: {
      id: "user_dupe",
      username: "dupe",
      email_addresses: [{ id: "e1", email_address: "dupe@example.com" }],
      primary_email_address_id: "e1",
    },
  });
  const svixId = "msg_dupe_123";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const result = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, message: "Duplicate event ignored" });
  assert.equal(createCalls, 0);
});

test("clerk webhook falls back to first and last name", async () => {
  const base64Secret = Buffer.from("test_webhook_secret").toString("base64");
  const webhookSecret = `whsec_${base64Secret}`;
  let updatedName: string | null = null;

  const handler = createClerkWebhookHandler({
    ...createNoopDeps(),
    findLocalUserByClerkId: async () => ({ clerkUserId: "user_abc" }),
    updateLocalUsername: async (_clerkUserId: string, username: string | null) => {
      updatedName = username;
    },
    markEventProcessed: async () => true,
    unmarkEventProcessed: async () => {},
  });

  const payload = JSON.stringify({
    type: "user.updated",
    data: {
      id: "user_abc",
      first_name: "Ada",
      last_name: "Lovelace",
      email_addresses: [{ id: "e1", email_address: "ada@example.com" }],
      primary_email_address_id: "e1",
    },
  });
  const svixId = "msg_name_fallback";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const svixSignature = createValidSvixSignature({
    secret: webhookSecret,
    svixId,
    svixTimestamp,
    payload,
  });

  const result = await handler({
    method: "POST",
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody: payload,
    webhookSecret,
  });

  assert.equal(result.status, 200);
  assert.equal(updatedName, "Ada Lovelace");
});
