import assert from "node:assert/strict";
import test from "node:test";
import { handleUserCharactersByUserIdApi } from "../src/server/userCharactersByUserIdApi";

function userCharacterRow(webId: string) {
  return {
    clerkUserId: "user_1",
    character: {
      id: 1,
      webId,
      characterName: "Divoxy",
      heraldName: "Divoxy",
      heraldTotalKills: 0,
      heraldTotalDeaths: 0,
      heraldTotalDeathBlows: 0,
      heraldTotalSoloKills: 0,
      heraldMidgardKills: 0,
      heraldMidgardDeaths: 0,
      heraldMidgardDeathBlows: 0,
      heraldMidgardSoloKills: 0,
      heraldAlbionKills: 0,
      heraldAlbionDeaths: 0,
      heraldAlbionDeathBlows: 0,
      heraldAlbionSoloKills: 0,
      heraldHiberniaKills: 0,
      heraldHiberniaDeaths: 0,
      heraldHiberniaDeathBlows: 0,
      heraldHiberniaSoloKills: 0,
    },
  };
}

test("handleUserCharactersByUserIdApi marks champion webIds returned by the lookup", async () => {
  const result = await handleUserCharactersByUserIdApi(
    {
      method: "GET",
      userId: "user_1",
      viewerClerkUserId: "user_1",
      viewerIsAdmin: false,
    },
    {
      getUserCharactersByUserId: async () => [userCharacterRow("w-1")],
      getClassChampionWebIds: async () => new Set(["w-1"]),
    },
  );

  assert.equal(result.status, 200);
  const body = result.body as any[];
  assert.equal(body.length, 1);
  assert.equal(body[0].isClassChampion, true);
});

test("handleUserCharactersByUserIdApi degrades to no crowns instead of failing the request when the champion lookup throws", async () => {
  const result = await handleUserCharactersByUserIdApi(
    {
      method: "GET",
      userId: "user_1",
      viewerClerkUserId: "user_1",
      viewerIsAdmin: false,
    },
    {
      getUserCharactersByUserId: async () => [userCharacterRow("w-1")],
      getClassChampionWebIds: async () => {
        throw new Error("class champion lookup unavailable");
      },
    },
  );

  assert.equal(result.status, 200);
  const body = result.body as any[];
  assert.equal(body.length, 1);
  assert.equal(body[0].isClassChampion, false);
});
