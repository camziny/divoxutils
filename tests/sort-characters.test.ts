import test from "node:test";
import assert from "node:assert/strict";
import { sortCharacters } from "../src/utils/sortCharacters";
import type { CharacterData } from "../src/utils/character";

const makeCharacter = (
  id: number,
  values: {
    heraldName: string;
    heraldClassName: string;
    heraldServerName: string;
    heraldLevel: number;
    heraldRealmPoints: number;
    realm: "Albion" | "Hibernia" | "Midgard";
  }
): CharacterData =>
  ({
    id,
    webId: `web-${id}`,
    initialCharacter: { id, userId: "u1", webId: `web-${id}` },
    character_web_id: `web-${id}`,
    characterName: values.heraldName,
    className: values.heraldClassName,
    realm: values.realm,
    totalRealmPoints: values.heraldRealmPoints,
    realmPointsLastWeek: 0,
    totalSoloKills: 0,
    soloKillsLastWeek: 0,
    totalDeaths: 0,
    deathsLastWeek: 0,
    lastUpdated: "now",
    nameLastUpdated: "now",
    player_kills: { total: { kills: 0, deaths: 0, death_blows: 0, solo_kills: 0 } },
    heraldCharacterWebId: `web-${id}`,
    heraldName: values.heraldName,
    heraldServerName: values.heraldServerName,
    heraldRealm: 1,
    heraldRace: "Race",
    heraldClassName: values.heraldClassName,
    heraldLevel: values.heraldLevel,
    heraldGuildName: "Guild",
    heraldRealmPoints: values.heraldRealmPoints,
    heraldBountyPoints: 0,
    heraldMasterLevel: "0",
    clerkUserId: "clerk_1",
    formattedHeraldRealmPoints: String(values.heraldRealmPoints),
  }) as CharacterData;

const fixture = [
  makeCharacter(1, {
    heraldName: "Zed",
    heraldClassName: "Wizard",
    heraldServerName: "Ywain10",
    heraldLevel: 50,
    heraldRealmPoints: 3000,
    realm: "Albion",
  }),
  makeCharacter(2, {
    heraldName: "Ada",
    heraldClassName: "Armsman",
    heraldServerName: "Gaheris",
    heraldLevel: 45,
    heraldRealmPoints: 1000,
    realm: "Midgard",
  }),
  makeCharacter(3, {
    heraldName: "Mia",
    heraldClassName: "Bard",
    heraldServerName: "Ywain1",
    heraldLevel: 47,
    heraldRealmPoints: 2000,
    realm: "Hibernia",
  }),
];

test("sortCharacters supports name asc/desc", () => {
  const asc = sortCharacters([...fixture], "name-asc").map((c) => c.heraldName);
  const desc = sortCharacters([...fixture], "name-desc").map((c) => c.heraldName);
  assert.deepEqual(asc, ["Ada", "Mia", "Zed"]);
  assert.deepEqual(desc, ["Zed", "Mia", "Ada"]);
});

test("sortCharacters supports class asc/desc", () => {
  const asc = sortCharacters([...fixture], "class-asc").map(
    (c) => c.heraldClassName
  );
  const desc = sortCharacters([...fixture], "class-desc").map(
    (c) => c.heraldClassName
  );
  assert.deepEqual(asc, ["Armsman", "Bard", "Wizard"]);
  assert.deepEqual(desc, ["Wizard", "Bard", "Armsman"]);
});

test("sortCharacters supports level asc/desc", () => {
  const asc = sortCharacters([...fixture], "level-asc").map((c) => c.heraldLevel);
  const desc = sortCharacters([...fixture], "level-desc").map((c) => c.heraldLevel);
  assert.deepEqual(asc, [45, 47, 50]);
  assert.deepEqual(desc, [50, 47, 45]);
});

test("sortCharacters supports server asc/desc", () => {
  const asc = sortCharacters([...fixture], "server-asc").map(
    (c) => c.heraldServerName
  );
  const desc = sortCharacters([...fixture], "server-desc").map(
    (c) => c.heraldServerName
  );
  assert.deepEqual(asc, ["Gaheris", "Ywain1", "Ywain10"]);
  assert.deepEqual(desc, ["Ywain10", "Ywain1", "Gaheris"]);
});

const statFixture = [
  makeCharacter(1, {
    heraldName: "Low",
    heraldClassName: "Wizard",
    heraldServerName: "Gaheris",
    heraldLevel: 50,
    heraldRealmPoints: 1000,
    realm: "Albion",
  }),
  makeCharacter(2, {
    heraldName: "High",
    heraldClassName: "Armsman",
    heraldServerName: "Gaheris",
    heraldLevel: 50,
    heraldRealmPoints: 2000,
    realm: "Midgard",
  }),
].map((character, index) => ({
  ...character,
  heraldTotalKills: index === 0 ? 10 : 50,
  heraldTotalDeaths: index === 0 ? 5 : 20,
  heraldTotalDeathBlows: index === 0 ? 2 : 15,
  heraldTotalSoloKills: index === 0 ? 1 : 8,
}));

test("sortCharacters supports kills asc/desc", () => {
  const asc = sortCharacters([...statFixture], "kills-asc").map((c) => c.heraldName);
  const desc = sortCharacters([...statFixture], "kills-desc").map((c) => c.heraldName);
  assert.deepEqual(asc, ["Low", "High"]);
  assert.deepEqual(desc, ["High", "Low"]);
});

test("sortCharacters supports deaths asc/desc", () => {
  const asc = sortCharacters([...statFixture], "deaths-asc").map((c) => c.heraldName);
  const desc = sortCharacters([...statFixture], "deaths-desc").map((c) => c.heraldName);
  assert.deepEqual(asc, ["Low", "High"]);
  assert.deepEqual(desc, ["High", "Low"]);
});

test("sortCharacters supports deathblows asc/desc", () => {
  const asc = sortCharacters([...statFixture], "deathblows-asc").map((c) => c.heraldName);
  const desc = sortCharacters([...statFixture], "deathblows-desc").map(
    (c) => c.heraldName
  );
  assert.deepEqual(asc, ["Low", "High"]);
  assert.deepEqual(desc, ["High", "Low"]);
});

test("sortCharacters supports solokills asc/desc", () => {
  const asc = sortCharacters([...statFixture], "solokills-asc").map((c) => c.heraldName);
  const desc = sortCharacters([...statFixture], "solokills-desc").map(
    (c) => c.heraldName
  );
  assert.deepEqual(asc, ["Low", "High"]);
  assert.deepEqual(desc, ["High", "Low"]);
});
