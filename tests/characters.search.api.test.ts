import test from "node:test";
import assert from "node:assert/strict";
import { createCharactersSearchHandler } from "../src/server/charactersSearchPagesHandler";

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, unknown>,
    body: undefined as unknown,
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

function createMockRequest(options?: {
  method?: string;
  query?: Record<string, unknown>;
}) {
  return {
    method: options?.method ?? "GET",
    query: options?.query ?? {},
    headers: {},
  } as any;
}

test("characters/search GET returns fetched characters", async () => {
  let captured: { name: string; cluster: string } | null = null;
  const handler = createCharactersSearchHandler({
    fetchCharacterDetails: async (name, cluster) => {
      captured = { name, cluster };
      return [{ characterName: "TestName" }];
    },
  });

  const req = createMockRequest({
    query: { name: "Kenco", cluster: "Ywain" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured, { name: "Kenco", cluster: "Ywain" });
  assert.deepEqual(res.body, [{ characterName: "TestName" }]);
});

test("characters/search returns 405 for non-GET", async () => {
  const handler = createCharactersSearchHandler({
    fetchCharacterDetails: async () => [],
  });

  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.headers.Allow, ["GET"]);
  assert.equal(res.body, "Method POST Not Allowed");
});

test("characters/search returns 400 when name is missing", async () => {
  let called = false;
  const handler = createCharactersSearchHandler({
    fetchCharacterDetails: async () => {
      called = true;
      return [];
    },
  });

  const req = createMockRequest({
    query: { cluster: "Ywain" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: "Name and cluster are required" });
  assert.equal(called, false);
});

test("characters/search returns 400 when cluster is missing", async () => {
  let called = false;
  const handler = createCharactersSearchHandler({
    fetchCharacterDetails: async () => {
      called = true;
      return [];
    },
  });

  const req = createMockRequest({
    query: { name: "Kenco" },
  });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: "Name and cluster are required" });
  assert.equal(called, false);
});
