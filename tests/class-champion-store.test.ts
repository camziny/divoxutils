import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { syncClassChampionsFromSources } from "../src/server/classChampionStore";
import { buildSyncSummary } from "../scripts/sync-class-champions";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as unknown as Response;
}

function createFakePrisma() {
  const upsertCalls: any[] = [];
  const prisma = {
    classChampion: {
      upsert: async (args: any) => {
        upsertCalls.push(args);
        return args;
      },
    },
  };
  return { prisma: prisma as unknown as PrismaClient, upsertCalls };
}

function findUpsertCall(upsertCalls: any[], canonicalClassName: string, realm: string) {
  return upsertCalls.find(
    (call) =>
      call.create.canonicalClassName === canonicalClassName &&
      call.create.realm === realm,
  );
}

test("syncClassChampionsFromSources: network failure writes a stale result via upsert without clobbering last-known-good fields", async () => {
  const { prisma, upsertCalls } = createFakePrisma();

  const fetchImpl = (async (url: RequestInfo | URL) => {
    const urlStr = url.toString();
    if (urlStr.includes("heraldapi.excidio.net")) {
      if (urlStr.includes("class=13")) {
        throw new Error("network down");
      }
      return jsonResponse({ head: {}, rank: 0, data: [] });
    }
    throw new Error(`unexpected fetch: ${urlStr}`);
  }) as typeof fetch;

  await syncClassChampionsFromSources(prisma, fetchImpl);

  const cabalistAlbion = findUpsertCall(upsertCalls, "Cabalist", "Albion");
  assert.ok(cabalistAlbion, "expected an upsert call for Cabalist/Albion");
  assert.equal(cabalistAlbion.update.validationStatus, "stale");
  assert.match(cabalistAlbion.update.validationError, /network down/);
  assert.equal(
    "webId" in cabalistAlbion.update,
    false,
    "stale update must not overwrite webId",
  );
  assert.equal(
    "heraldName" in cabalistAlbion.update,
    false,
    "stale update must not overwrite heraldName",
  );
  assert.equal(
    "heraldRealmPoints" in cabalistAlbion.update,
    false,
    "stale update must not overwrite heraldRealmPoints",
  );
  assert.equal(
    "validatedAt" in cabalistAlbion.update,
    false,
    "stale update must not overwrite validatedAt",
  );
});

test("syncClassChampionsFromSources: an unparseable Excidio response is stale, not invalid", async () => {
  const { prisma, upsertCalls } = createFakePrisma();

  const fetchImpl = (async () =>
    jsonResponse({ head: {}, rank: 0, data: [] })) as typeof fetch;

  await syncClassChampionsFromSources(prisma, fetchImpl);

  const friarAlbion = findUpsertCall(upsertCalls, "Friar", "Albion");
  assert.ok(friarAlbion, "expected an upsert call for Friar/Albion");
  assert.equal(friarAlbion.create.validationStatus, "stale");
  assert.match(
    friarAlbion.create.validationError,
    /Could not parse Excidio top character API response/,
  );
});

test("syncClassChampionsFromSources: a Herald rule failure is invalid, not stale", async () => {
  const { prisma, upsertCalls } = createFakePrisma();

  const fetchImpl = (async (url: RequestInfo | URL) => {
    const urlStr = url.toString();
    if (urlStr.includes("heraldapi.excidio.net")) {
      if (urlStr.includes("class=26")) {
        return jsonResponse({
          head: { "cl.name": 0, "cl.character_web_id": 1, "cl.realm": 2 },
          rank: 0,
          data: [["BadHealer", "web-healer", 2]],
        });
      }
      return jsonResponse({ head: {}, rank: 0, data: [] });
    }
    if (urlStr.includes("api.camelotherald.com")) {
      return jsonResponse({
        character_web_id: "web-healer",
        name: "BadHealer",
        server_name: "Ywain1",
        realm: 2,
        class_name: "Necromancer",
        realm_war_stats: { current: { realm_points: 100_000_000 } },
      });
    }
    throw new Error(`unexpected fetch: ${urlStr}`);
  }) as typeof fetch;

  await syncClassChampionsFromSources(prisma, fetchImpl);

  const healerMidgard = findUpsertCall(upsertCalls, "Healer", "Midgard");
  assert.ok(healerMidgard, "expected an upsert call for Healer/Midgard");
  assert.equal(healerMidgard.create.validationStatus, "invalid");
  assert.match(
    healerMidgard.create.validationError,
    /Herald class does not match source class/,
  );
});

test("buildSyncSummary includes stale results, not just invalid ones, in its diagnostic output", async () => {
  const { prisma } = createFakePrisma();

  const fetchImpl = (async (url: RequestInfo | URL) => {
    const urlStr = url.toString();
    if (urlStr.includes("heraldapi.excidio.net")) {
      if (urlStr.includes("class=13")) {
        throw new Error("simulated network failure");
      }
      return jsonResponse({ head: {}, rank: 0, data: [] });
    }
    throw new Error(`unexpected fetch: ${urlStr}`);
  }) as typeof fetch;

  const result = await syncClassChampionsFromSources(prisma, fetchImpl);
  const summary = buildSyncSummary(result);

  assert.ok(
    result.failed > 0,
    "expected at least one failed bucket to set up this regression check",
  );
  assert.equal(
    summary.invalidResults.length,
    result.failed + result.invalid,
    "buildSyncSummary's diagnostic list must include stale rows, not just invalid ones",
  );

  const cabalistAlbion = summary.invalidResults.find(
    (row) => row.className === "Cabalist" && row.realm === "Albion",
  );
  assert.ok(cabalistAlbion, "expected the network-failure bucket to appear in invalidResults");
  assert.equal(cabalistAlbion.status, "stale");
  assert.match(cabalistAlbion.error ?? "", /simulated network failure/);
});
