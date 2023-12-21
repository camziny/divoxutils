import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

interface CharacterStats {
  webId: string;
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  deathsLastWeek: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.method === "POST") {
    let skip = 0;
    const batchSize = 50;
    let totalUpdated = 0;
    while (true) {
      const characters = await prisma.character.findMany({
        skip: skip,
        take: batchSize,
      });

      if (characters.length === 0) {
        break;
      }

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

      totalUpdated += characters.length;
      skip += batchSize;
    }

    res.status(200).json({ message: "Leaderboard stats updated successfully" });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
