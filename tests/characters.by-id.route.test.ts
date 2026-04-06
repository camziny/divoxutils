import test from "node:test";
import assert from "node:assert/strict";
import { createCharacterByIdRouteHandlers } from "../src/server/characterByIdRouteHandlers";

test("characters by id GET returns 400 for invalid id", async () => {
  const handlers = createCharacterByIdRouteHandlers({
    deps: {
      getCharacterById: async () => null,
      updateCharacter: async () => ({}),
      deleteCharacter: async () => ({}),
    },
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "abc" },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "Character ID must be a positive integer.",
  });
});

test("characters by id GET returns 404 when missing", async () => {
  const handlers = createCharacterByIdRouteHandlers({
    deps: {
      getCharacterById: async () => null,
      updateCharacter: async () => ({}),
      deleteCharacter: async () => ({}),
    },
  });

  const response = await handlers.GET(new Request("http://localhost") as any, {
    params: { id: "4" },
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "Character not found." });
});

test("characters by id PUT updates character", async () => {
  const handlers = createCharacterByIdRouteHandlers({
    deps: {
      getCharacterById: async () => null,
      updateCharacter: async (id, data) => ({ id, data }),
      deleteCharacter: async () => ({}),
    },
  });

  const response = await handlers.PUT(
    new Request("http://localhost", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "NewName" }),
    }) as any,
    {
      params: { id: "4" },
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 4, data: { name: "NewName" } });
});

test("characters by id DELETE returns 204", async () => {
  const handlers = createCharacterByIdRouteHandlers({
    deps: {
      getCharacterById: async () => null,
      updateCharacter: async () => ({}),
      deleteCharacter: async () => ({}),
    },
  });

  const response = await handlers.DELETE(new Request("http://localhost") as any, {
    params: { id: "4" },
  });

  assert.equal(response.status, 204);
});

test("characters by id POST returns 405 with allow header", async () => {
  const handlers = createCharacterByIdRouteHandlers({
    deps: {
      getCharacterById: async () => null,
      updateCharacter: async () => ({}),
      deleteCharacter: async () => ({}),
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost", { method: "POST" }) as any,
    {
      params: { id: "4" },
    }
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, PUT, DELETE");
});
