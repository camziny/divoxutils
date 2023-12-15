import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

interface CharacterStats {
  webId: string;
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  irs: number;
  deathsLastWeek: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
  irsLastWeek: number;
}

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
                  totalRealmPoints: true,
                  totalSoloKills: true,
                  totalDeaths: true,
                  deathsLastWeek: true,
                  realmPointsLastWeek: true,
                  soloKillsLastWeek: true,
                },
              },
            },
          },
        },
      });

      const aggregatedLeaderboardData = leaderboardData.map((user) => {
        let totalPoints = 0;
        let totalSoloKills = 0;
        let totalDeaths = 0;
        let deathsLastWeek = 0;
        let realmPointsLastWeek = 0;
        let soloKillsLastWeek = 0;

        user.characters.forEach((userCharacter) => {
          totalPoints += userCharacter.character.totalRealmPoints;
          totalSoloKills += userCharacter.character.totalSoloKills;
          totalDeaths += userCharacter.character.totalDeaths;
          deathsLastWeek += userCharacter.character.deathsLastWeek;
          realmPointsLastWeek += userCharacter.character.realmPointsLastWeek;
          soloKillsLastWeek += userCharacter.character.soloKillsLastWeek;
        });

        const irs =
          totalDeaths > 0
            ? parseFloat((totalPoints / totalDeaths).toFixed(0))
            : 0;

        const irsLastWeek =
          deathsLastWeek > 0
            ? (realmPointsLastWeek / deathsLastWeek).toFixed(0)
            : "0.00";

        return {
          userId: user.id,
          clerkUserId: user.clerkUserId,
          userName: user.name,
          totalRealmPoints: totalPoints,
          totalSoloKills: totalSoloKills,
          totalDeaths: totalDeaths,
          deathsLastWeek: deathsLastWeek,
          realmPointsLastWeek: realmPointsLastWeek,
          soloKillsLastWeek: soloKillsLastWeek,
          irs: irs,
          irsLastWeek: parseFloat(irsLastWeek),
        };
      });

      aggregatedLeaderboardData.sort(
        (a, b) => b.totalRealmPoints - a.totalRealmPoints
      );
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
