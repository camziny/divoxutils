import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getLastProcessedCharacterId,
  updateLastProcessedCharacterId,
} from "@/controllers/batchStateController";

interface CharacterUpdateData {
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  totalDeaths: number;
  deathsLastWeek: number;
  lastUpdated: Date;
}

function calculateUpdateTimes(updateHourUTC: number, gracePeriodHours: number) {
  let lastMonday = new Date();
  lastMonday.setUTCHours(updateHourUTC, 0, 0, 0);
  lastMonday.setUTCDate(
    lastMonday.getUTCDate() - ((lastMonday.getUTCDay() + 6) % 7)
  );
  let currentUpdateStartTime = new Date(lastMonday.getTime());
  if (
    new Date().getUTCDay() === 1 &&
    new Date().getUTCHours() >= updateHourUTC
  ) {
    currentUpdateStartTime.setUTCDate(currentUpdateStartTime.getUTCDate() + 7);
  }
  const gracePeriodEndTime = new Date(
    lastMonday.getTime() + gracePeriodHours * 60 * 60 * 1000
  );

  return { currentUpdateStartTime, gracePeriodEndTime };
}

export default async function batchedLeaderboardUpdate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    const batchSize = 100;
    let updatedCount = 0;
    let failedCount = 0;

    const gracePeriodHours = 0.5;
    const updateHourUTC = 5;

    const { currentUpdateStartTime, gracePeriodEndTime } = calculateUpdateTimes(
      updateHourUTC,
      gracePeriodHours
    );

    const lastProcessedId = await getLastProcessedCharacterId(prisma);

    const characters = await prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
        lastUpdated: { lt: currentUpdateStartTime },
      },
      take: batchSize,
      orderBy: { id: "asc" },
    });

    for (const character of characters) {
      try {
        const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data && data.realm_war_stats && data.realm_war_stats.current) {
          const currentStats = data.realm_war_stats.current;
          if (character.lastUpdated) {
            const characterLastUpdated = new Date(character.lastUpdated);

            const realmPointsDiff =
              currentStats.realm_points - character.totalRealmPoints;
            const soloKillsDiff =
              currentStats.player_kills.total.solo_kills -
              character.totalSoloKills;
            const deathsDiff =
              currentStats.player_kills.total.deaths - character.totalDeaths;

            let updateData = {
              totalRealmPoints: currentStats.realm_points,
              totalSoloKills: currentStats.player_kills.total.solo_kills,
              totalDeaths: currentStats.player_kills.total.deaths,
              realmPointsLastWeek: 0,
              soloKillsLastWeek: 0,
              deathsLastWeek: 0,
              lastUpdated: new Date(),
            };

            if (
              characterLastUpdated < currentUpdateStartTime &&
              characterLastUpdated <= gracePeriodEndTime
            ) {
              updateData.realmPointsLastWeek =
                realmPointsDiff > 0 ? realmPointsDiff : 0;
              updateData.soloKillsLastWeek =
                soloKillsDiff > 0 ? soloKillsDiff : 0;
              updateData.deathsLastWeek = deathsDiff > 0 ? deathsDiff : 0;
            }

            await prisma.character.update({
              where: { id: character.id },
              data: updateData,
            });
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(
          `Failed to update stats for character ${character.webId}:`,
          error
        );
        failedCount++;
      }
    }

    if (characters.length > 0) {
      const newLastProcessedId = characters[characters.length - 1].id;
      await updateLastProcessedCharacterId(prisma, newLastProcessedId);
    }

    res.status(200).json({
      message: "Batch update process completed",
      updatedCharacters: updatedCount,
      failedUpdates: failedCount,
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
