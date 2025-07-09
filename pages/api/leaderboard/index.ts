import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const leaderboardData = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          clerkUserId: true,
          characters: {
            select: {
              character: {
                select: {
                  id: true,
                  characterName: true,
                  totalRealmPoints: true,
                  totalSoloKills: true,
                  totalDeaths: true,
                  totalDeathBlows: true,
                  deathsLastWeek: true,
                  deathBlowsLastWeek: true,
                  realmPointsLastWeek: true,
                  soloKillsLastWeek: true,
                  lastUpdated: true,
                  heraldRealmPoints: true,
                  heraldTotalDeaths: true,
                  heraldTotalSoloKills: true,
                  heraldTotalDeathBlows: true,
                },
              },
            },
          },
        },
      });

      // Debug logging
      if (leaderboardData.length > 0 && leaderboardData[0].characters.length > 0) {
        console.log("First user's first character data:", JSON.stringify(leaderboardData[0].characters[0].character, null, 2));
      }

      const isWithinThisWeek = (date: Date) => {
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
        startOfThisWeek.setUTCHours(9, 0, 0, 0);
        return date >= startOfThisWeek;
      };

      const aggregatedLeaderboardData = leaderboardData.map((user) => {
        let totalPoints = 0;
        let totalSoloKills = 0;
        let totalDeaths = 0;
        let totalDeathBlows = 0;
        let deathsLastWeek = 0;
        let deathBlowsLastWeek = 0;
        let realmPointsLastWeek = 0;
        let soloKillsLastWeek = 0;
        let latestUpdate: Date | null = null;

        let realmPointsThisWeek = 0;
        let deathsThisWeek = 0;
        let deathBlowsThisWeek = 0;
        let soloKillsThisWeek = 0;
        let irsThisWeek = 0;

        let accumulatedRealmPointsThisWeek = 0;
        let accumulatedDeathsThisWeek = 0;
        let accumulatedSoloKillsThisWeek = 0;
        let accumulatedDeathBlowsThisWeek = 0;

        const processedCharacterIds = new Set<number>();

        user.characters.forEach((userCharacter) => {
          const character = userCharacter.character;

          if (processedCharacterIds.has(character.id)) {
            console.warn(`Character ${character.id} processed multiple times.`);
            return;
          }

          processedCharacterIds.add(character.id);

          totalPoints += character.totalRealmPoints;
          totalSoloKills += character.totalSoloKills;
          totalDeaths += character.totalDeaths;
          totalDeathBlows += character.totalDeathBlows;

          if (character.realmPointsLastWeek !== character.totalRealmPoints) {
            realmPointsLastWeek += character.realmPointsLastWeek;
          }
          if (character.soloKillsLastWeek !== character.totalSoloKills) {
            soloKillsLastWeek += character.soloKillsLastWeek;
          }
          if (character.deathsLastWeek !== character.totalDeaths) {
            deathsLastWeek += character.deathsLastWeek;
          }
          if (character.deathBlowsLastWeek !== character.totalDeathBlows) {
            deathBlowsLastWeek += character.deathBlowsLastWeek;
          }
          if (character.totalRealmPoints === 0) {
            accumulatedRealmPointsThisWeek += 0;
            accumulatedDeathsThisWeek += 0;
            accumulatedSoloKillsThisWeek += 0;
            accumulatedDeathBlowsThisWeek += 0;
          } else {
            if (
              character.heraldRealmPoints !== null &&
              character.totalRealmPoints !== null
            ) {
              const rpThisWeek =
                character.heraldRealmPoints - character.totalRealmPoints;
              accumulatedRealmPointsThisWeek += rpThisWeek;
            }

            if (
              character.heraldTotalDeaths !== null &&
              character.totalDeaths !== null
            ) {
              const deathsThisWeekValue =
                character.heraldTotalDeaths - character.totalDeaths;
              accumulatedDeathsThisWeek += deathsThisWeekValue;
            }

            if (
              character.heraldTotalSoloKills !== null &&
              character.totalSoloKills !== null
            ) {
              const skThisWeek =
                character.heraldTotalSoloKills - character.totalSoloKills;
              accumulatedSoloKillsThisWeek += skThisWeek;
            }

            if (
              character.heraldTotalDeathBlows !== null &&
              character.totalDeathBlows !== null
            ) {
              const dbThisWeek =
                character.heraldTotalDeathBlows - character.totalDeathBlows;
              accumulatedDeathBlowsThisWeek += dbThisWeek;
            }
          }
        });

        realmPointsThisWeek = Math.max(0, accumulatedRealmPointsThisWeek);
        deathsThisWeek = Math.max(0, accumulatedDeathsThisWeek);
        soloKillsThisWeek = Math.max(0, accumulatedSoloKillsThisWeek);
        deathBlowsThisWeek = Math.max(0, accumulatedDeathBlowsThisWeek);

        irsThisWeek =
          deathsThisWeek > 0
            ? Math.round(realmPointsThisWeek / deathsThisWeek)
            : realmPointsThisWeek;

        const irs =
          totalDeaths > 0 ? Math.round(totalPoints / totalDeaths) : totalPoints;

        const irsLastWeek =
          deathsLastWeek > 0
            ? Math.round(realmPointsLastWeek / deathsLastWeek)
            : realmPointsLastWeek;

        return {
          userId: user.id,
          clerkUserId: user.clerkUserId,
          userName: user.name,
          totalRealmPoints: totalPoints,
          totalSoloKills: totalSoloKills,
          totalDeaths: totalDeaths,
          totalDeathBlows: totalDeathBlows,
          deathsLastWeek: deathsLastWeek,
          deathBlowsLastWeek: deathBlowsLastWeek,
          realmPointsLastWeek: realmPointsLastWeek,
          soloKillsLastWeek: soloKillsLastWeek,
          irs: irs,
          irsLastWeek: irsLastWeek,
          lastUpdated: latestUpdate,
          realmPointsThisWeek: realmPointsThisWeek,
          deathsThisWeek: deathsThisWeek,
          soloKillsThisWeek: soloKillsThisWeek,
          deathBlowsThisWeek: deathBlowsThisWeek,
          irsThisWeek: irsThisWeek,
        };
      });

      aggregatedLeaderboardData.sort(
        (a, b) => b.totalRealmPoints - a.totalRealmPoints
      );
      
      // Debug logging for aggregated data
      if (aggregatedLeaderboardData.length > 0) {
        console.log("First aggregated user data:", JSON.stringify(aggregatedLeaderboardData[0], null, 2));
      }
      
      res.status(200).json(aggregatedLeaderboardData);
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
      res.status(500).json({ message: "Error fetching leaderboard data" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
