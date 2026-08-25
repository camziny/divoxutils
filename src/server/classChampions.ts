import { classesByRealm } from "@/app/draft/_lib/constants";
import {
  getClassChampionClusterName,
  getRealmForChampionClass,
  isChampionRealm,
  isYwainServer,
  normalizeChampionClassName,
  YWAIN_CLUSTER_NAME,
} from "@/utils/championClassName";
import { realmMapping } from "@/server/services/characterService";

export const CLASS_CHAMPION_SOURCE = "excidio-class-leaderboard";
export const CLASS_CHAMPION_FRESHNESS_DAYS = 7;

export type ClassChampionBucket = {
  canonicalClassName: string;
  realm: string;
  excidioClassId: number;
  excidioRealmId: number;
  sourceUrl: string;
};

export type ExcidioClassChampionSourceRow = {
  webId: string;
  sourceName: string;
  sourceRank: number;
  sourceUrl: string;
};

export type ExcidioClassChampionApiResponse = {
  head?: Record<string, number>;
  rank?: number;
  data?: unknown[];
};

export type HeraldChampionValidationPayload = {
  character_web_id?: string | number;
  name?: string;
  server_name?: string;
  realm?: number;
  class_name?: string;
  realm_war_stats?: {
    current?: {
      realm_points?: number;
    };
  };
};

export type ValidatedClassChampion = {
  heraldServerName: string;
  canonicalClassName: string;
  realm: string;
  webId: string;
  heraldName: string;
  heraldRealmPoints: number;
  source: string;
  sourceUrl: string;
  sourceRank: number;
  sourceFetchedAt: Date;
  validatedAt: Date;
  validationStatus: "valid";
};

export type InvalidClassChampionSourceResult = {
  heraldServerName: string;
  canonicalClassName: string;
  realm: string;
  source: string;
  sourceUrl: string;
  sourceRank: number;
  sourceFetchedAt: Date;
  validationStatus: "invalid";
  validationError: string;
};

export type StaleClassChampionSourceResult = {
  heraldServerName: string;
  canonicalClassName: string;
  realm: string;
  source: string;
  sourceUrl: string;
  sourceRank: number;
  sourceFetchedAt: Date;
  validationStatus: "stale";
  validationError: string;
};

export type ClassChampionSourceResult =
  | ValidatedClassChampion
  | InvalidClassChampionSourceResult
  | StaleClassChampionSourceResult;

const EXCIDIO_CLASS_IDS: Record<string, number> = {
  Armsman: 2,
  Cabalist: 13,
  Cleric: 6,
  Friar: 10,
  Heretic: 33,
  Infiltrator: 9,
  Mauler: 60,
  Mercenary: 11,
  Minstrel: 4,
  Necromancer: 12,
  Paladin: 1,
  Reaver: 19,
  Scout: 3,
  Sorcerer: 8,
  Theurgist: 5,
  Wizard: 7,
  Animist: 55,
  Bainshee: 39,
  Bard: 48,
  Blademaster: 43,
  Champion: 45,
  Druid: 47,
  Eldritch: 40,
  Enchanter: 41,
  Hero: 44,
  Mentalist: 42,
  Nightshade: 49,
  Ranger: 50,
  Valewalker: 56,
  Vampiir: 58,
  Warden: 46,
  Berserker: 31,
  Bonedancer: 30,
  Healer: 26,
  Hunter: 25,
  Runemaster: 29,
  Savage: 32,
  Shadowblade: 23,
  Shaman: 28,
  Skald: 24,
  Spiritmaster: 27,
  Thane: 21,
  Valkyrie: 34,
  Warlock: 59,
  Warrior: 22,
};

const REALM_TO_EXCIDIO_ID: Record<string, number> = {
  Albion: 1,
  Midgard: 2,
  Hibernia: 3,
};

const MAULER_EXCIDIO_CLASS_IDS_BY_REALM: Record<string, number> = {
  Albion: 60,
  Midgard: 61,
  Hibernia: 62,
};

export function getClassChampionBuckets(): ClassChampionBucket[] {
  const buckets: ClassChampionBucket[] = [];
  for (const [realm, classNames] of Object.entries(classesByRealm)) {
    for (const className of classNames) {
      const canonicalClassName = normalizeChampionClassName(className);
      const excidioClassId =
        canonicalClassName === "Mauler"
          ? MAULER_EXCIDIO_CLASS_IDS_BY_REALM[realm]
          : EXCIDIO_CLASS_IDS[canonicalClassName];
      const excidioRealmId =
        canonicalClassName === "Mauler" ? REALM_TO_EXCIDIO_ID[realm] : 0;

      if (!excidioClassId || excidioRealmId === undefined) {
        continue;
      }

      buckets.push({
        canonicalClassName,
        realm,
        excidioClassId,
        excidioRealmId,
        sourceUrl: getExcidioClassChampionUrl(excidioClassId, excidioRealmId),
      });
    }
  }

  return buckets;
}

export function getExcidioClassChampionUrl(
  excidioClassId: number,
  excidioRealmId = 0,
): string {
  return `http://www.excidio.net/herald/list/character:rps::1:${excidioClassId}:${excidioRealmId}:desc:::1`;
}

export function getExcidioClassChampionApiUrl(excidioClassId: number): string {
  return `http://heraldapi.excidio.net/character/list/type=rps/class=${excidioClassId}/timeout=0`;
}

export function parseExcidioClassChampionApiTopCharacter(
  payload: ExcidioClassChampionApiResponse,
  bucket: Pick<ClassChampionBucket, "excidioRealmId" | "realm" | "sourceUrl">,
): ExcidioClassChampionSourceRow | null {
  const nameIndex = payload.head?.["cl.name"];
  const webIdIndex = payload.head?.["cl.character_web_id"];
  const realmIndex = payload.head?.["cl.realm"];
  if (
    nameIndex === undefined ||
    webIdIndex === undefined ||
    realmIndex === undefined ||
    !Array.isArray(payload.data)
  ) {
    return null;
  }

  const rowIndex = payload.data.findIndex((row) => {
    if (!Array.isArray(row)) {
      return false;
    }

    return (
      bucket.excidioRealmId === 0 || row[realmIndex] === bucket.excidioRealmId
    );
  });

  if (rowIndex < 0) {
    return null;
  }

  const row = payload.data[rowIndex];
  if (!Array.isArray(row)) {
    return null;
  }

  const webId = row[webIdIndex];
  const sourceName = row[nameIndex];
  if (typeof webId !== "string" || typeof sourceName !== "string") {
    return null;
  }

  const baseRank = typeof payload.rank === "number" ? payload.rank : 0;
  return {
    webId,
    sourceName: sourceName.trim(),
    sourceRank: baseRank + rowIndex + 1,
    sourceUrl: bucket.sourceUrl,
  };
}

export function validateClassChampionSourceRow(
  bucket: Pick<
    ClassChampionBucket,
    "canonicalClassName" | "realm" | "sourceUrl"
  >,
  sourceRow: ExcidioClassChampionSourceRow,
  heraldPayload: HeraldChampionValidationPayload,
  now = new Date(),
): ClassChampionSourceResult {
  const sourceBase = {
    heraldServerName: YWAIN_CLUSTER_NAME,
    canonicalClassName: bucket.canonicalClassName,
    realm: bucket.realm,
    source: CLASS_CHAMPION_SOURCE,
    sourceUrl: sourceRow.sourceUrl,
    sourceRank: sourceRow.sourceRank,
    sourceFetchedAt: now,
  };

  const webId =
    heraldPayload.character_web_id !== undefined &&
    heraldPayload.character_web_id !== null
      ? String(heraldPayload.character_web_id)
      : null;
  const heraldName = heraldPayload.name;
  const heraldClassName = heraldPayload.class_name;
  const canonicalHeraldClassName = normalizeChampionClassName(heraldClassName);
  const actualRealm =
    heraldPayload.realm !== undefined
      ? (realmMapping[heraldPayload.realm] ?? null)
      : getRealmForChampionClass(canonicalHeraldClassName);
  const heraldRealmPoints =
    heraldPayload.realm_war_stats?.current?.realm_points;
  const clusterName = getClassChampionClusterName(heraldPayload.server_name);

  if (webId !== sourceRow.webId) {
    return invalidChampionResult(
      sourceBase,
      "Herald webId does not match source row",
    );
  }

  if (!clusterName || !isYwainServer(heraldPayload.server_name)) {
    return invalidChampionResult(
      sourceBase,
      "Herald character is not on Ywain",
    );
  }

  if (canonicalHeraldClassName !== bucket.canonicalClassName) {
    return invalidChampionResult(
      sourceBase,
      "Herald class does not match source class",
    );
  }

  if (
    !actualRealm ||
    !isChampionRealm(actualRealm) ||
    actualRealm !== bucket.realm
  ) {
    return invalidChampionResult(
      sourceBase,
      "Herald realm does not match source realm",
    );
  }

  if (!heraldName || heraldRealmPoints === undefined) {
    return invalidChampionResult(
      sourceBase,
      "Herald response is missing name or realm points",
    );
  }

  return {
    ...sourceBase,
    webId,
    heraldName,
    heraldRealmPoints,
    validatedAt: now,
    validationStatus: "valid",
  };
}

function invalidChampionResult(
  sourceBase: Omit<
    InvalidClassChampionSourceResult,
    "validationStatus" | "validationError"
  >,
  validationError: string,
): InvalidClassChampionSourceResult {
  return {
    ...sourceBase,
    validationStatus: "invalid",
    validationError,
  };
}

export function isFreshClassChampion(
  champion: { validationStatus: string; validatedAt: Date | null },
  now = new Date(),
): boolean {
  if (
    (champion.validationStatus !== "valid" &&
      champion.validationStatus !== "stale") ||
    !champion.validatedAt
  ) {
    return false;
  }

  const maxAgeMs = CLASS_CHAMPION_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - champion.validatedAt.getTime() <= maxAgeMs;
}
