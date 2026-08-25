import assert from "node:assert/strict";
import test from "node:test";
import {
  getClassChampionBuckets,
  getExcidioClassChampionApiUrl,
  getExcidioClassChampionUrl,
  isFreshClassChampion,
  parseExcidioClassChampionApiTopCharacter,
  validateClassChampionSourceRow,
} from "../src/server/classChampions";
import {
  getClassChampionTooltip,
  getRealmForChampionClass,
  normalizeChampionClassName,
  YWAIN_CLUSTER_NAME,
} from "../src/utils/championClassName";

test("normalizeChampionClassName merges gendered class names", () => {
  assert.equal(normalizeChampionClassName("Sorceress"), "Sorcerer");
  assert.equal(normalizeChampionClassName("Armswoman"), "Armsman");
  assert.equal(normalizeChampionClassName("Heroine"), "Hero");
  assert.equal(normalizeChampionClassName("Enchantress"), "Enchanter");
  assert.equal(normalizeChampionClassName("Huntress"), "Hunter");
});

test("getExcidioClassChampionUrl builds class leaderboard URLs", () => {
  assert.equal(
    getExcidioClassChampionUrl(10),
    "http://www.excidio.net/herald/list/character:rps::1:10:0:desc:::1",
  );
  assert.equal(
    getExcidioClassChampionUrl(60, 2),
    "http://www.excidio.net/herald/list/character:rps::1:60:2:desc:::1",
  );
});

test("getExcidioClassChampionApiUrl builds class API URLs", () => {
  assert.equal(
    getExcidioClassChampionApiUrl(27),
    "http://heraldapi.excidio.net/character/list/type=rps/class=27/timeout=0",
  );
});

test("getClassChampionBuckets includes known class ids and mauler realm buckets", () => {
  const buckets = getClassChampionBuckets();
  const friar = buckets.find((bucket) => bucket.canonicalClassName === "Friar");
  const ranger = buckets.find(
    (bucket) => bucket.canonicalClassName === "Ranger",
  );
  const healer = buckets.find(
    (bucket) => bucket.canonicalClassName === "Healer",
  );
  const maulers = buckets.filter(
    (bucket) => bucket.canonicalClassName === "Mauler",
  );

  assert.equal(friar?.sourceUrl, getExcidioClassChampionUrl(10));
  assert.equal(ranger?.sourceUrl, getExcidioClassChampionUrl(50));
  assert.equal(healer?.sourceUrl, getExcidioClassChampionUrl(26));
  assert.deepEqual(
    maulers
      .map(
        (bucket) =>
          `${bucket.realm}:${bucket.excidioClassId}:${bucket.sourceUrl}`,
      )
      .sort(),
    [
      `Albion:60:${getExcidioClassChampionUrl(60, 1)}`,
      `Hibernia:62:${getExcidioClassChampionUrl(62, 3)}`,
      `Midgard:61:${getExcidioClassChampionUrl(61, 2)}`,
    ],
  );
});

test("parseExcidioClassChampionApiTopCharacter reads API rows", () => {
  const bucket = {
    excidioRealmId: 0,
    realm: "Midgard",
    sourceUrl: getExcidioClassChampionUrl(27),
  };
  const row = parseExcidioClassChampionApiTopCharacter(
    {
      head: {
        "cl.name": 0,
        "cl.realm_points": 1,
        "cl.class": 4,
        "cl.realm": 7,
        "cl.character_web_id": 8,
      },
      rank: 0,
      data: [
        [
          "Bayastv",
          289_225_181,
          1_000_000,
          50,
          27,
          0,
          null,
          2,
          "l8r458q5JyQ",
          0,
        ],
      ],
    },
    bucket,
  );

  assert.deepEqual(row, {
    webId: "l8r458q5JyQ",
    sourceName: "Bayastv",
    sourceRank: 1,
    sourceUrl: bucket.sourceUrl,
  });
});

test("parseExcidioClassChampionApiTopCharacter returns null without matching realm", () => {
  const bucket = {
    excidioRealmId: 2,
    realm: "Midgard",
    sourceUrl: getExcidioClassChampionUrl(61, 2),
  };
  const row = parseExcidioClassChampionApiTopCharacter(
    {
      head: {
        "cl.name": 0,
        "cl.realm": 1,
        "cl.character_web_id": 2,
      },
      rank: 0,
      data: [
        ["AlbMauler", 1, "alb-web-id"],
        ["HibMauler", 3, "hib-web-id"],
      ],
    },
    bucket,
  );

  assert.equal(row, null);
});

test("validateClassChampionSourceRow returns valid Herald-backed champion", () => {
  const bucket = {
    canonicalClassName: "Cabalist",
    realm: "Albion",
    excidioClassId: 13,
    excidioRealmId: 0,
    sourceUrl: getExcidioClassChampionUrl(13),
  };
  const now = new Date("2026-06-19T12:00:00Z");
  const result = validateClassChampionSourceRow(
    bucket,
    {
      webId: "olMR-iYld6A",
      sourceName: "OldName",
      sourceRank: 1,
      sourceUrl: bucket.sourceUrl,
    },
    {
      character_web_id: "olMR-iYld6A",
      name: "Divoxzyna",
      server_name: "Ywain5",
      realm: 1,
      class_name: "Cabalist",
      realm_war_stats: {
        current: {
          realm_points: 188_000_000,
        },
      },
    },
    now,
  );

  assert.equal(result.validationStatus, "valid");
  if (result.validationStatus === "valid") {
    assert.equal(result.heraldServerName, YWAIN_CLUSTER_NAME);
    assert.equal(result.heraldName, "Divoxzyna");
    assert.equal(result.heraldRealmPoints, 188_000_000);
    assert.equal(result.validatedAt, now);
  }
});

test("validateClassChampionSourceRow rejects mismatched Herald class", () => {
  const bucket = {
    canonicalClassName: "Spiritmaster",
    realm: "Midgard",
    excidioClassId: 27,
    excidioRealmId: 0,
    sourceUrl: getExcidioClassChampionUrl(27),
  };
  const result = validateClassChampionSourceRow(
    bucket,
    {
      webId: "oU91PX6FhkI",
      sourceName: "Divoxqt",
      sourceRank: 1,
      sourceUrl: bucket.sourceUrl,
    },
    {
      character_web_id: "oU91PX6FhkI",
      name: "Divoxqt",
      server_name: "Ywain1",
      realm: 2,
      class_name: "Healer",
      realm_war_stats: {
        current: {
          realm_points: 200_000_000,
        },
      },
    },
  );

  assert.equal(result.validationStatus, "invalid");
});

test("isFreshClassChampion requires valid recent validation", () => {
  const now = new Date("2026-06-19T12:00:00Z");

  assert.equal(
    isFreshClassChampion(
      {
        validationStatus: "valid",
        validatedAt: new Date("2026-06-18T12:00:00Z"),
      },
      now,
    ),
    true,
  );
  assert.equal(
    isFreshClassChampion(
      {
        validationStatus: "valid",
        validatedAt: new Date("2026-06-01T12:00:00Z"),
      },
      now,
    ),
    false,
  );
  assert.equal(
    isFreshClassChampion(
      {
        validationStatus: "invalid",
        validatedAt: new Date("2026-06-18T12:00:00Z"),
      },
      now,
    ),
    false,
  );
});

test("isFreshClassChampion treats a stale champion as fresh within the grace window", () => {
  const now = new Date("2026-06-19T12:00:00Z");

  assert.equal(
    isFreshClassChampion(
      {
        validationStatus: "stale",
        validatedAt: new Date("2026-06-18T12:00:00Z"),
      },
      now,
    ),
    true,
  );
  assert.equal(
    isFreshClassChampion(
      {
        validationStatus: "stale",
        validatedAt: new Date("2026-06-01T12:00:00Z"),
      },
      now,
    ),
    false,
  );
  assert.equal(
    isFreshClassChampion(
      {
        validationStatus: "stale",
        validatedAt: null,
      },
      now,
    ),
    false,
  );
});

test("getClassChampionTooltip uses merged ywain cluster name", () => {
  assert.equal(
    getClassChampionTooltip("Mauler", "Midgard"),
    "Top Mauler on Ywain (Midgard)",
  );
  assert.equal(
    getClassChampionTooltip("Bard", "Hibernia"),
    "Top Bard on Ywain",
  );
});

test("getRealmForChampionClass resolves realm from class except mauler", () => {
  assert.equal(getRealmForChampionClass("Spiritmaster"), "Midgard");
  assert.equal(getRealmForChampionClass("Cabalist"), "Albion");
  assert.equal(getRealmForChampionClass("Mauler"), null);
});
