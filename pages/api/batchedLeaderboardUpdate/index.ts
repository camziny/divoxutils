import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function batchedLeaderboardUpdate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    const batchSize = 5;
    const characters = await prisma.character.findMany({
      where: {
        totalRealmPoints: 0,
      },
      take: batchSize,
    });

    for (const character of characters) {
      try {
        const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data && data.realm_war_stats && data.realm_war_stats.current) {
          const currentStats = data.realm_war_stats.current;

          const realmPointsLastWeek =
            currentStats.realm_points - character.totalRealmPoints;
          const soloKillsLastWeek =
            currentStats.player_kills.total.solo_kills -
            character.totalSoloKills;
          const deathsLastWeek =
            currentStats.player_kills.total.deaths - character.totalDeaths;

          await prisma.character.update({
            where: { webId: character.webId },
            data: {
              totalRealmPoints: currentStats.realm_points,
              realmPointsLastWeek,
              totalSoloKills: currentStats.player_kills.total.solo_kills,
              soloKillsLastWeek,
              totalDeaths: currentStats.player_kills.total.deaths,
              deathsLastWeek,
            },
          });
        }
      } catch (error) {
        console.error(
          `Failed to update stats for character ${character.webId}:`,
          error
        );
      }
    }

    res.status(200).json({ message: "Batch update successful" });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
