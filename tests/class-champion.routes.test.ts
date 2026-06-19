import assert from "node:assert/strict";
import test from "node:test";
import { createUpdateClassChampionsRouteHandlers } from "../src/server/api/classChampionRouteHandlers";

function authorizedRequest(url: string, method: string) {
  return new Request(url, {
    method,
    headers: { authorization: "Bearer secret" },
  }) as any;
}

test("updateClassChampions cron requires auth and returns sync summary", async () => {
  const handlers = createUpdateClassChampionsRouteHandlers({
    cronSecret: "secret",
    syncClassChampions: async () => ({
      checked: 3,
      synced: 2,
      invalid: 1,
      failed: 0,
      results: [
        {
          canonicalClassName: "Cabalist",
          realm: "Albion",
          validationStatus: "valid",
        },
      ],
    }),
  });

  const unauthorized = await handlers.POST(
    new Request("http://localhost/api/updateClassChampions", {
      method: "POST",
    }) as any
  );
  assert.equal(unauthorized.status, 401);

  const response = await handlers.POST(
    authorizedRequest("http://localhost/api/updateClassChampions", "POST")
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: "Class champion sync completed",
    checked: 3,
    synced: 2,
    invalid: 1,
    failed: 0,
    results: [
      {
        canonicalClassName: "Cabalist",
        realm: "Albion",
        validationStatus: "valid",
      },
    ],
  });
});
