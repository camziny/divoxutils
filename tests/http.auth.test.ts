import test from "node:test";
import assert from "node:assert/strict";
import { requireBotAuth } from "../convex/httpAuth";

test("requireBotAuth rejects missing header", async () => {
  const req = new Request("https://example.com/activeDrafts");
  const res = requireBotAuth(req, "secret-key");
  assert.ok(res);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, "Unauthorized");
});

test("requireBotAuth rejects wrong header", async () => {
  const req = new Request("https://example.com/activeDrafts", {
    headers: { "x-bot-api-key": "wrong" },
  });
  const res = requireBotAuth(req, "secret-key");
  assert.ok(res);
  assert.equal(res.status, 401);
});

test("requireBotAuth rejects when expected key is unset", () => {
  const req = new Request("https://example.com/activeDrafts", {
    headers: { "x-bot-api-key": "secret-key" },
  });
  const res = requireBotAuth(req, undefined);
  assert.ok(res);
  assert.equal(res.status, 401);
});

test("requireBotAuth allows valid header", () => {
  const req = new Request("https://example.com/activeDrafts", {
    headers: { "x-bot-api-key": "secret-key" },
  });
  const res = requireBotAuth(req, "secret-key");
  assert.equal(res, null);
});
