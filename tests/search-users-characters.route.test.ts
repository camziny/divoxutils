import test from "node:test";
import assert from "node:assert/strict";
import { createSearchUsersAndCharactersRouteHandlers } from "../src/server/searchUsersAndCharactersRouteHandlers";

test("search users and characters route GET returns users", async () => {
  const handlers = createSearchUsersAndCharactersRouteHandlers({
    deps: {
      findUsers: async ({ normalizedQuery }) => [
        {
          id: 7,
          clerkUserId: "u_7",
          name: normalizedQuery,
          supporterTier: 1,
          characters: [],
        },
      ],
    },
  });

  const response = await handlers.GET(
    new Request("http://localhost/api/searchUsersAndCharacters?name=Kenco") as any
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    users: [
      {
        id: 7,
        clerkUserId: "u_7",
        name: "kenco",
        supporterTier: 1,
        characters: [],
      },
    ],
  });
});

test("search users and characters route POST returns 405 and Allow header", async () => {
  const handlers = createSearchUsersAndCharactersRouteHandlers({
    deps: {
      findUsers: async () => [],
    },
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/searchUsersAndCharacters?name=Kenco", {
      method: "POST",
    }) as any
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
  assert.equal(await response.text(), "Method POST Not Allowed");
});
