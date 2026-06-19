import type { PrismaClient } from "@prisma/client";
import {
  CLASS_CHAMPION_SOURCE,
  type ClassChampionSourceResult,
  getClassChampionBuckets,
  getExcidioClassChampionApiUrl,
  isFreshClassChampion,
  parseExcidioClassChampionApiTopCharacter,
  type ExcidioClassChampionApiResponse,
  validateClassChampionSourceRow,
  type HeraldChampionValidationPayload,
} from "@/server/classChampions";
import { YWAIN_CLUSTER_NAME } from "@/utils/championClassName";

const HERALD_CHARACTER_INFO_URL =
  "https://api.camelotherald.com/character/info";

export async function getClassChampionWebIdsForCharacters(
  prisma: PrismaClient,
  characters: Array<{ webId: string }>,
): Promise<Set<string>> {
  const webIds = characters.map((character) => character.webId);
  if (webIds.length === 0) {
    return new Set();
  }

  const champions = await prisma.classChampion.findMany({
    where: { webId: { in: webIds } },
    select: {
      webId: true,
      validationStatus: true,
      validatedAt: true,
    },
  });

  return new Set(
    champions
      .filter((champion) => isFreshClassChampion(champion))
      .map((champion) => champion.webId),
  );
}

export async function syncClassChampionsFromSources(
  prisma: PrismaClient,
  fetchImpl: typeof fetch,
) {
  const buckets = getClassChampionBuckets();
  const results: ClassChampionSourceResult[] = [];
  let synced = 0;
  let invalid = 0;
  let failed = 0;

  for (const bucket of buckets) {
    try {
      const sourceResponse = await fetchImpl(
        getExcidioClassChampionApiUrl(bucket.excidioClassId),
        {
          headers: { "User-Agent": "divoxutils/1.0" },
        },
      );
      const sourcePayload =
        (await sourceResponse.json()) as ExcidioClassChampionApiResponse;
      const sourceRow = parseExcidioClassChampionApiTopCharacter(
        sourcePayload,
        bucket,
      );

      if (!sourceRow) {
        const result = invalidResultForBucket(
          bucket.canonicalClassName,
          bucket.realm,
          bucket.sourceUrl,
          "Could not parse Excidio top character API response",
        );
        await upsertInvalidChampion(prisma, result);
        results.push(result);
        invalid += 1;
        continue;
      }

      const heraldResponse = await fetchImpl(
        `${HERALD_CHARACTER_INFO_URL}/${sourceRow.webId}`,
        {
          headers: { "User-Agent": "divoxutils/1.0" },
        },
      );
      const heraldPayload =
        (await heraldResponse.json()) as HeraldChampionValidationPayload;
      const result = validateClassChampionSourceRow(
        bucket,
        sourceRow,
        heraldPayload,
      );

      await upsertChampionSourceResult(prisma, result);
      results.push(result);
      if (result.validationStatus === "valid") {
        synced += 1;
      } else {
        invalid += 1;
      }
    } catch (error) {
      const result = invalidResultForBucket(
        bucket.canonicalClassName,
        bucket.realm,
        bucket.sourceUrl,
        error instanceof Error ? error.message : "Unknown sync error",
      );
      await upsertInvalidChampion(prisma, result);
      results.push(result);
      failed += 1;
    }
  }

  return {
    checked: buckets.length,
    synced,
    invalid,
    failed,
    results,
  };
}

async function upsertChampionSourceResult(
  prisma: PrismaClient,
  result: ClassChampionSourceResult,
) {
  if (result.validationStatus === "valid") {
    await prisma.classChampion.upsert({
      where: {
        heraldServerName_canonicalClassName_realm: {
          heraldServerName: result.heraldServerName,
          canonicalClassName: result.canonicalClassName,
          realm: result.realm,
        },
      },
      create: {
        heraldServerName: result.heraldServerName,
        canonicalClassName: result.canonicalClassName,
        realm: result.realm,
        webId: result.webId,
        heraldName: result.heraldName,
        heraldRealmPoints: result.heraldRealmPoints,
        source: result.source,
        sourceUrl: result.sourceUrl,
        sourceRank: result.sourceRank,
        sourceFetchedAt: result.sourceFetchedAt,
        validatedAt: result.validatedAt,
        validationStatus: result.validationStatus,
      },
      update: {
        webId: result.webId,
        heraldName: result.heraldName,
        heraldRealmPoints: result.heraldRealmPoints,
        source: result.source,
        sourceUrl: result.sourceUrl,
        sourceRank: result.sourceRank,
        sourceFetchedAt: result.sourceFetchedAt,
        validatedAt: result.validatedAt,
        validationStatus: result.validationStatus,
        validationError: null,
      },
    });
    return;
  }

  await upsertInvalidChampion(prisma, result);
}

function invalidResultForBucket(
  canonicalClassName: string,
  realm: string,
  sourceUrl: string,
  validationError: string,
): Extract<ClassChampionSourceResult, { validationStatus: "invalid" }> {
  return {
    heraldServerName: YWAIN_CLUSTER_NAME,
    canonicalClassName,
    realm,
    source: CLASS_CHAMPION_SOURCE,
    sourceUrl,
    sourceRank: 1,
    sourceFetchedAt: new Date(),
    validationStatus: "invalid",
    validationError,
  };
}

async function upsertInvalidChampion(
  prisma: PrismaClient,
  result: Extract<ClassChampionSourceResult, { validationStatus: "invalid" }>,
) {
  const existing = await prisma.classChampion.findUnique({
    where: {
      heraldServerName_canonicalClassName_realm: {
        heraldServerName: result.heraldServerName,
        canonicalClassName: result.canonicalClassName,
        realm: result.realm,
      },
    },
  });

  if (existing) {
    await prisma.classChampion.update({
      where: { id: existing.id },
      data: {
        source: result.source,
        sourceUrl: result.sourceUrl,
        sourceRank: result.sourceRank,
        sourceFetchedAt: result.sourceFetchedAt,
        validationStatus: result.validationStatus,
        validationError: result.validationError,
      },
    });
    return;
  }

  await prisma.classChampion.create({
    data: {
      heraldServerName: result.heraldServerName,
      canonicalClassName: result.canonicalClassName,
      realm: result.realm,
      webId: "",
      heraldName: "",
      heraldRealmPoints: 0,
      source: result.source,
      sourceUrl: result.sourceUrl,
      sourceRank: result.sourceRank,
      sourceFetchedAt: result.sourceFetchedAt,
      validationStatus: result.validationStatus,
      validationError: result.validationError,
    },
  });
}
