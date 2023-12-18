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
    const batchSize = 10;
    let updatedCount = 0;
    let failedCount = 0;
    let processedUserData = [];

    const users = await prisma.user.findMany({
      where: {
        characters: {
          some: {
            character: {
              totalRealmPoints: 0,
            },
          },
        },
      },
      take: batchSize,
      include: {
        characters: {
          include: {
            character: true,
          },
        },
      },
    });

    for (const user of users) {
      let processedCharactersData = [];
      for (const userCharacter of user.characters) {
        const character = userCharacter.character;
        if (character.totalRealmPoints === 0) {
          try {
            const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.realm_war_stats && data.realm_war_stats.current) {
              const currentStats = data.realm_war_stats.current;

              if (currentStats.realm_points === 0) {
                continue;
              }

              const realmPointsLastWeek =
                currentStats.realm_points - character.totalRealmPoints;
              const soloKillsLastWeek =
                currentStats.player_kills.total.solo_kills -
                character.totalSoloKills;
              const deathsLastWeek =
                currentStats.player_kills.total.deaths - character.totalDeaths;

              const updatedCharacter = await prisma.character.update({
                where: { id: character.id },
                data: {
                  totalRealmPoints: currentStats.realm_points,
                  realmPointsLastWeek,
                  totalSoloKills: currentStats.player_kills.total.solo_kills,
                  soloKillsLastWeek,
                  totalDeaths: currentStats.player_kills.total.deaths,
                  deathsLastWeek,
                },
              });
              updatedCount++;
              processedCharactersData.push({
                characterWebId: character.webId,
                updated: true,
              });
            }
          } catch (error) {
            console.error(
              `Failed to update stats for character ${character.webId}:`,
              error
            );
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            failedCount++;
            processedCharactersData.push({
              characterWebId: character.webId,
              updated: false,
              error: errorMessage,
            });
          }
        }
      }

      processedUserData.push({
        clerkUserId: user.clerkUserId,
        user: user.name,
        charactersProcessed: processedCharactersData,
      });
    }

    res.status(200).json({
      message: "Batch update process completed",
      processedUsers: users.length,
      updatedCharacters: updatedCount,
      failedUpdates: failedCount,
      userDetails: processedUserData,
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
