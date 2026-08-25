import prisma from "../prisma/prismaClient";
import { syncClassChampionsFromSources } from "../src/server/classChampionStore";
import type { ClassChampionSourceResult } from "../src/server/classChampions";

export function buildSyncSummary(result: {
  checked: number;
  synced: number;
  invalid: number;
  failed: number;
  results: ClassChampionSourceResult[];
}) {
  return {
    checked: result.checked,
    synced: result.synced,
    invalid: result.invalid,
    failed: result.failed,
    invalidResults: result.results
      .filter((row) => row.validationStatus !== "valid")
      .map((row) => ({
        className: row.canonicalClassName,
        realm: row.realm,
        sourceUrl: row.sourceUrl,
        status: row.validationStatus,
        error: row.validationError,
      })),
  };
}

async function main() {
  const result = await syncClassChampionsFromSources(prisma, fetch);

  console.log(JSON.stringify(buildSyncSummary(result), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
