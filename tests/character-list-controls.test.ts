import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCharactersByClass,
  getEffectiveCharacterSortKey,
  getNextColumnSortState,
  normalizeClassFilter,
  type ClassFilter,
} from "../src/utils/characterListControls";
import type { CharacterData } from "../src/utils/character";

const makeCharacter = (
  heraldClassName: string,
  extra: Partial<CharacterData> = {}
): CharacterData =>
  ({
    id: 1,
    webId: "web-1",
    initialCharacter: { id: 1, userId: "u1", webId: "web-1" },
    character_web_id: "web-1",
    characterName: "Char",
    className: heraldClassName,
    realm: "Albion",
    totalRealmPoints: 1000,
    realmPointsLastWeek: 100,
    totalSoloKills: 10,
    soloKillsLastWeek: 1,
    totalDeaths: 5,
    deathsLastWeek: 1,
    lastUpdated: "now",
    nameLastUpdated: "now",
    player_kills: { total: { kills: 10, deaths: 5, death_blows: 2, solo_kills: 1 } },
    heraldCharacterWebId: "web-1",
    heraldName: "Char",
    heraldServerName: "Gaheris",
    heraldRealm: 1,
    heraldRace: "Briton",
    heraldClassName,
    heraldLevel: 50,
    heraldGuildName: "Guild",
    heraldRealmPoints: 1000,
    heraldBountyPoints: 0,
    heraldMasterLevel: "0",
    clerkUserId: "clerk_1",
    formattedHeraldRealmPoints: "1,000",
    ...extra,
  }) as CharacterData;

test("normalizeClassFilter accepts valid values and falls back to all", () => {
  assert.equal(normalizeClassFilter("tank"), "tank");
  assert.equal(normalizeClassFilter(["caster"]), "caster");
  assert.equal(normalizeClassFilter("invalid"), "all");
  assert.equal(normalizeClassFilter(undefined), "all");
});

test("filterCharactersByClass includes dual-category classes for tank and caster filters", () => {
  const chars = [
    makeCharacter("Mauler", { id: 1 }),
    makeCharacter("Wizard", { id: 2 }),
    makeCharacter("Armsman", { id: 3 }),
    makeCharacter("Bard", { id: 4 }),
    makeCharacter("Thane", { id: 5 }),
    makeCharacter("Necromancer", { id: 6 }),
  ];

  const tank = filterCharactersByClass(chars, "tank").map((c) => c.id);
  const caster = filterCharactersByClass(chars, "caster").map((c) => c.id);
  const support = filterCharactersByClass(chars, "support").map((c) => c.id);
  const all = filterCharactersByClass(chars, "all").map((c) => c.id);

  assert.deepEqual(tank.sort((a, b) => a - b), [1, 3, 5, 6]);
  assert.deepEqual(caster.sort((a, b) => a - b), [1, 2, 5, 6]);
  assert.deepEqual(support, [4]);
  assert.deepEqual(all, [1, 2, 3, 4, 5, 6]);
});

test("filterCharactersByClass matches female class variants to male canonical classes", () => {
  const chars = [
    makeCharacter("Armswoman", { id: 1 }),
    makeCharacter("Heroine", { id: 2 }),
    makeCharacter("Sorceress", { id: 3 }),
    makeCharacter("Enchantress", { id: 4 }),
  ];

  const tank = filterCharactersByClass(chars, "tank").map((c) => c.id);
  const caster = filterCharactersByClass(chars, "caster").map((c) => c.id);

  assert.deepEqual(tank.sort((a, b) => a - b), [1, 2]);
  assert.deepEqual(caster.sort((a, b) => a - b), [3, 4]);
});

test("getEffectiveCharacterSortKey prioritizes column sort when present", () => {
  assert.equal(
    getEffectiveCharacterSortKey("realm", "name", "asc"),
    "name-asc"
  );
  assert.equal(
    getEffectiveCharacterSortKey("realm", "server", "desc"),
    "server-desc"
  );
  assert.equal(
    getEffectiveCharacterSortKey("realm", "rank", "desc"),
    "rank-high-to-low"
  );
  assert.equal(
    getEffectiveCharacterSortKey("realm", "rank", "asc"),
    "rank-low-to-high"
  );
  assert.equal(
    getEffectiveCharacterSortKey("rank-high-to-low", null, "asc"),
    "rank-high-to-low"
  );
});

test("getNextColumnSortState toggles same column and defaults by type", () => {
  assert.deepEqual(getNextColumnSortState(null, "asc", "name"), {
    columnSort: "name",
    columnSortDir: "asc",
  });
  assert.deepEqual(getNextColumnSortState("name", "asc", "name"), {
    columnSort: "name",
    columnSortDir: "desc",
  });
  assert.deepEqual(getNextColumnSortState("name", "desc", "name"), {
    columnSort: "name",
    columnSortDir: "asc",
  });
  assert.deepEqual(getNextColumnSortState("name", "asc", "level"), {
    columnSort: "level",
    columnSortDir: "desc",
  });
  assert.deepEqual(getNextColumnSortState("level", "desc", "rank"), {
    columnSort: "rank",
    columnSortDir: "desc",
  });
});

test("all class filters are supported by normalizer", () => {
  const values: ClassFilter[] = ["all", "tank", "caster", "support", "stealth"];
  for (const value of values) {
    assert.equal(normalizeClassFilter(value), value);
  }
});
