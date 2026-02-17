import test from "node:test";
import assert from "node:assert/strict";
import { createUpdateUsernameHandler } from "../pages/api/users/update-username";

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
  };
  return res;
}

function createRequest(options?: {
  method?: string;
  body?: Record<string, unknown>;
}) {
  const req: any = {
    method: options?.method ?? "PATCH",
    body: options?.body ?? {},
  };
  return req;
}

test("update username rejects non-PATCH methods", async () => {
  const handler = createUpdateUsernameHandler({
    getAuthUserId: () => "user_123",
    updateClerkUsername: async () => undefined,
    updateLocalUsername: async () => ({ clerkUserId: "user_123", name: "abc" }),
  });
  const req = createRequest({ method: "POST", body: { username: "validname" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.headers.Allow, ["PATCH"]);
});

test("update username rejects unauthenticated requests", async () => {
  const handler = createUpdateUsernameHandler({
    getAuthUserId: () => null,
    updateClerkUsername: async () => undefined,
    updateLocalUsername: async () => ({ clerkUserId: "user_123", name: "abc" }),
  });
  const req = createRequest({ body: { username: "validname" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: "Unauthorized" });
});

test("update username validates minimum length", async () => {
  const handler = createUpdateUsernameHandler({
    getAuthUserId: () => "user_123",
    updateClerkUsername: async () => undefined,
    updateLocalUsername: async () => ({ clerkUserId: "user_123", name: "abc" }),
  });
  const req = createRequest({ body: { username: "ab" } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: "Username must be at least 3 characters long.",
  });
});

test("update username trims and updates both clerk and local user", async () => {
  let clerkUpdateArgs: { userId: string; username: string } | null = null;
  let localUpdateArgs: { userId: string; username: string } | null = null;

  const handler = createUpdateUsernameHandler({
    getAuthUserId: () => "user_123",
    updateClerkUsername: async (userId, username) => {
      clerkUpdateArgs = { userId, username };
    },
    updateLocalUsername: async (userId, username) => {
      localUpdateArgs = { userId, username };
      return { clerkUserId: userId, name: username };
    },
  });
  const req = createRequest({ body: { username: "  ValidName  " } });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(clerkUpdateArgs, { userId: "user_123", username: "ValidName" });
  assert.deepEqual(localUpdateArgs, { userId: "user_123", username: "ValidName" });
  assert.deepEqual(res.body, {
    success: true,
    user: {
      clerkUserId: "user_123",
      name: "ValidName",
    },
  });
});
