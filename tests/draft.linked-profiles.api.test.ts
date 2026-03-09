import test from "node:test";
import assert from "node:assert/strict";
import { createLinkedProfilesHandler } from "../pages/api/draft/linked-profiles";
import { formatRealmRankWithLevel, getRealmRankForPoints } from "../src/utils/character";

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
  body?: Record<string, unknown>;
}) {
  return {
    method: options?.method ?? "POST",
    body: options?.body ?? {},
    query: {},
    headers: {},
  } as any;
}

test("linked profiles rejects non-POST requests", async () => {
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async () => [],
    now: () => 1_000,
    cacheTtlMs: 60_000,
    maxCacheEntries: 200,
    cacheStore: new Map(),
  });
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Method not allowed" });
});

test("linked profiles aggregates highest class rank and caches by sorted roster", async () => {
  let fetchCalls = 0;
  const seenIds: string[][] = [];
  const cacheStore = new Map();
  const now = 10_000;
  const rrPoints = 10_500_000;
  const expectedRank = getRealmRankForPoints(rrPoints);
  const expectedFormatted = formatRealmRankWithLevel(expectedRank);

  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async (discordUserIds) => {
      fetchCalls += 1;
      seenIds.push(discordUserIds);
      return [
        {
          providerUserId: "d2",
          user: {
            name: "PlayerTwo",
            characters: [
              {
                character: {
                  className: "Cleric",
                  realm: "Albion",
                  heraldRealm: 1,
                  totalRealmPoints: 500_000,
                  heraldRealmPoints: null,
                },
              },
              {
                character: {
                  className: "Cleric",
                  realm: "Albion",
                  heraldRealm: 1,
                  totalRealmPoints: 300_000,
                  heraldRealmPoints: rrPoints,
                },
              },
            ],
          },
        },
      ];
    },
    now: () => now,
    cacheTtlMs: 60_000,
    maxCacheEntries: 200,
    cacheStore,
  });

  const req1 = createMockRequest({
    body: { discordUserIds: ["d2", "d1", "d2"] },
  });
  const res1 = createMockResponse();
  await handler(req1, res1);

  assert.equal(res1.statusCode, 200);
  assert.equal(fetchCalls, 1);
  assert.deepEqual(seenIds[0], ["d1", "d2"]);
  assert.equal(res1.body.links.d2.profileName, "PlayerTwo");
  assert.equal(res1.body.links.d2.highestRankByClass.Cleric.rank, expectedRank);
  assert.equal(
    res1.body.links.d2.highestRankByClass.Cleric.formattedRank,
    expectedFormatted
  );
  assert.equal(
    res1.body.links.d2.highestRankByClassRealm["Albion:Cleric"].formattedRank,
    expectedFormatted
  );

  const req2 = createMockRequest({
    body: { discordUserIds: ["d1", "d2"] },
  });
  const res2 = createMockResponse();
  await handler(req2, res2);

  assert.equal(res2.statusCode, 200);
  assert.equal(fetchCalls, 1);
  assert.deepEqual(res2.body, res1.body);
});

test("linked profiles refreshes after cache expiry", async () => {
  let fetchCalls = 0;
  let now = 10_000;
  const cacheStore = new Map();
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async () => {
      fetchCalls += 1;
      return [
        {
          providerUserId: "d9",
          user: {
            name: "PlayerNine",
            characters: [],
          },
        },
      ];
    },
    now: () => now,
    cacheTtlMs: 1_000,
    maxCacheEntries: 200,
    cacheStore,
  });

  const req = createMockRequest({
    body: { discordUserIds: ["d9"] },
  });
  const res1 = createMockResponse();
  await handler(req, res1);
  assert.equal(fetchCalls, 1);

  now += 1_500;
  const res2 = createMockResponse();
  await handler(req, res2);
  assert.equal(fetchCalls, 2);
});

test("linked profiles tracks realm-specific classes independently", async () => {
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async () => [
      {
        providerUserId: "dm",
        user: {
          name: "MaulerOnlyAlb",
          characters: [
            {
              character: {
                className: "Mauler",
                realm: "Albion",
                heraldRealm: 1,
                totalRealmPoints: 110_000,
                heraldRealmPoints: 120_000,
              },
            },
          ],
        },
      },
    ],
    now: () => 1_000,
    cacheTtlMs: 60_000,
    maxCacheEntries: 200,
    cacheStore: new Map(),
  });

  const req = createMockRequest({
    body: { discordUserIds: ["dm"] },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.links.dm.highestRankByClassRealm["Albion:Mauler"]);
  assert.equal(res.body.links.dm.highestRankByClassRealm["Hibernia:Mauler"], undefined);
  assert.equal(res.body.links.dm.highestRankByClassRealm["Midgard:Mauler"], undefined);
});

test("linked profiles normalizes realm aliases for realm-specific keys", async () => {
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async () => [
      {
        providerUserId: "dr",
        user: {
          name: "RealmAliasUser",
          characters: [
            {
              character: {
                className: "Mauler",
                realm: "alb",
                heraldRealm: 1,
                totalRealmPoints: 50_000,
                heraldRealmPoints: 60_000,
              },
            },
          ],
        },
      },
    ],
    now: () => 1_000,
    cacheTtlMs: 60_000,
    maxCacheEntries: 200,
    cacheStore: new Map(),
  });

  const req = createMockRequest({
    body: { discordUserIds: ["dr"] },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.links.dr.highestRankByClassRealm["Albion:Mauler"]);
});

test("linked profiles falls back to herald realm when realm text is unrecognized", async () => {
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async () => [
      {
        providerUserId: "dh",
        user: {
          name: "HeraldRealmUser",
          characters: [
            {
              character: {
                className: "Mauler",
                realm: "Unknown",
                heraldRealm: 1,
                totalRealmPoints: 70_000,
                heraldRealmPoints: 90_000,
              },
            },
          ],
        },
      },
    ],
    now: () => 1_000,
    cacheTtlMs: 60_000,
    maxCacheEntries: 200,
    cacheStore: new Map(),
  });

  const req = createMockRequest({
    body: { discordUserIds: ["dh"] },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.links.dh.highestRankByClassRealm["Albion:Mauler"]);
});

test("linked profiles evicts oldest cache key when cache limit is exceeded", async () => {
  const cacheStore = new Map();
  let fetchCalls = 0;
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async (ids) => {
      fetchCalls += 1;
      return [
        {
          providerUserId: ids[0],
          user: {
            name: ids[0],
            characters: [],
          },
        },
      ];
    },
    now: () => 1_000,
    cacheTtlMs: 60_000,
    maxCacheEntries: 2,
    cacheStore,
  });

  await handler(createMockRequest({ body: { discordUserIds: ["d1"] } }), createMockResponse());
  await handler(createMockRequest({ body: { discordUserIds: ["d2"] } }), createMockResponse());
  await handler(createMockRequest({ body: { discordUserIds: ["d3"] } }), createMockResponse());

  assert.equal(cacheStore.size, 2);
  assert.equal(cacheStore.has("d1"), false);
  assert.equal(cacheStore.has("d2"), true);
  assert.equal(cacheStore.has("d3"), true);
  assert.equal(fetchCalls, 3);
});

test("linked profiles short-circuits empty ids without fetch", async () => {
  let fetchCalls = 0;
  const handler = createLinkedProfilesHandler({
    fetchLinkedProfiles: async () => {
      fetchCalls += 1;
      return [];
    },
    now: () => 1_000,
    cacheTtlMs: 60_000,
    maxCacheEntries: 200,
    cacheStore: new Map(),
  });

  const req = createMockRequest({
    body: { discordUserIds: [] },
  });
  const res = createMockResponse();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { links: {} });
  assert.equal(fetchCalls, 0);
});
