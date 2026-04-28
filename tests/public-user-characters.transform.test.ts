import test from "node:test";
import assert from "node:assert/strict";
import { mapUserCharactersToPublicPayload } from "../src/server/publicUserCharacters";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "../src/utils/character";

test("mapUserCharactersToPublicPayload maps character rows to public payload", () => {
  const clerkUserId = "user_abc";
  const rows = [
    {
      character: {
        id: 5,
        webId: "w-5",
        characterName: "Divoxy",
        className: "Healer",
        realm: "Midgard",
        previousCharacterName: null,
        totalRealmPoints: 1200,
        realmPointsLastWeek: 40,
        totalKills: 6,
        killsLastWeek: 2,
        totalSoloKills: 3,
        soloKillsLastWeek: 1,
        totalDeaths: 2,
        deathsLastWeek: 1,
        totalDeathBlows: 2,
        deathBlowsLastWeek: 1,
        lastUpdated: null,
        nameLastUpdated: null,
        heraldCharacterWebId: "w-5",
        heraldName: "Divoxy",
        heraldServerName: "Ywain",
        heraldRealm: 2,
        heraldRace: "Norseman",
        heraldClassName: "Healer",
        heraldLevel: 50,
        heraldGuildName: "Guild",
        heraldRealmPoints: 1200,
        heraldBountyPoints: 10,
        heraldMasterLevel: "5 Battlemaster",
        heraldTotalKills: 11,
        heraldTotalDeaths: 7,
        heraldTotalDeathBlows: 2,
        heraldTotalSoloKills: 4,
        heraldAlbionKills: 1,
        heraldAlbionDeaths: 2,
        heraldAlbionDeathBlows: 3,
        heraldAlbionSoloKills: 4,
        heraldMidgardKills: 5,
        heraldMidgardDeaths: 6,
        heraldMidgardDeathBlows: 7,
        heraldMidgardSoloKills: 8,
        heraldHiberniaKills: 9,
        heraldHiberniaDeaths: 10,
        heraldHiberniaDeathBlows: 11,
        heraldHiberniaSoloKills: 12,
      },
    },
  ];

  const payload = mapUserCharactersToPublicPayload(rows, clerkUserId);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].id, 5);
  assert.equal(payload[0].clerkUserId, clerkUserId);
  assert.deepEqual(payload[0].initialCharacter, {
    id: 5,
    userId: clerkUserId,
    webId: "w-5",
  });
  assert.equal(
    payload[0].formattedHeraldRealmPoints,
    formatRealmRankWithLevel(getRealmRankForPoints(1200))
  );
  assert.equal(payload[0].totalKills, 6);
  assert.equal(payload[0].killsLastWeek, 2);
  assert.equal(payload[0].player_kills.total.kills, 11);
});

test("mapUserCharactersToPublicPayload filters null character rows", () => {
  const payload = mapUserCharactersToPublicPayload(
    [{ character: null }, { character: null }],
    "user_abc"
  );
  assert.deepEqual(payload, []);
});
