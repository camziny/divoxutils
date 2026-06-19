import prisma from "../prisma/prismaClient";
import { syncClassChampionsFromSources } from "../src/server/classChampionStore";

async function main() {
  const result = await syncClassChampionsFromSources(prisma, fetch);

  console.log(
    JSON.stringify(
      {
        checked: result.checked,
        synced: result.synced,
        invalid: result.invalid,
        failed: result.failed,
        invalidResults: result.results
          .filter((row) => row.validationStatus === "invalid")
          .map((row) => ({
            className: row.canonicalClassName,
            realm: row.realm,
            sourceUrl: row.sourceUrl,
            error: row.validationError,
          })),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
