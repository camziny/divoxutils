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

    for (const character of charactersToUpdate) {
      await prisma.character.update({
        where: { id: character.id },
        data: {
          realmPointsLastWeek: 0,
          soloKillsLastWeek: 0,
          deathsLastWeek: 0,
        },
      });
      lastProcessedId = character.id;
      updatedCount++;
    }

    console.log(`Last processed character ID: ${lastProcessedId}`);
  }

  res.status(200).json({
    message: `Successfully reset last week's stats for ${updatedCount} characters`,
  });
}
