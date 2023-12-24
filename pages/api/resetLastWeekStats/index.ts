import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function resetLastWeekStats(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const batchSize = 50;
  let updatedCount = 0;
  let lastProcessedId = 0;

  while (true) {
    const charactersToUpdate = await prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
        OR: [
          { realmPointsLastWeek: { not: 0 } },
          { soloKillsLastWeek: { not: 0 } },
          { deathsLastWeek: { not: 0 } },
        ],
      },
      take: batchSize,
      orderBy: { id: "asc" },
    });

    if (charactersToUpdate.length === 0) {
      break;
    }

    const idsToUpdate = charactersToUpdate.map((character) => character.id);

    await prisma.character.updateMany({
      where: {
        id: { in: idsToUpdate },
      },
      data: {
        realmPointsLastWeek: 0,
        soloKillsLastWeek: 0,
        deathsLastWeek: 0,
      },
    });

    lastProcessedId = charactersToUpdate[charactersToUpdate.length - 1].id;
    updatedCount += charactersToUpdate.length;
  }

  res.status(200).json({
    message: `Successfully reset last week's stats for ${updatedCount} characters`,
  });
}
