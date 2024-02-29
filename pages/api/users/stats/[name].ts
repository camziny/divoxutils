import prisma from "../../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import { getAllUserNames } from "@/controllers/userCharacterController";
import { findClosestMatch } from "@/utils/levenshtein";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { name } = req.query;

    try {
      const typedName = typeof name === "string" ? name : "";
      const allUserNames = await getAllUserNames();
      const closestUserName = findClosestMatch(typedName, allUserNames);
      const userData = await prisma.user.findUnique({
        where: {
          name: closestUserName,
        },
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
                  lastUpdated: true,
                },
              },
            },
          },
        },
      });

      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      let totalPoints = 0;
      let totalSoloKills = 0;
      let totalDeaths = 0;
      let deathsLastWeek = 0;
      let realmPointsLastWeek = 0;
      let soloKillsLastWeek = 0;
      let latestUpdate: Date | null = null;

      userData.characters.forEach((userCharacter: any) => {
        const character = userCharacter.character;
        totalPoints += character.totalRealmPoints;
        totalSoloKills += character.totalSoloKills;
        totalDeaths += character.totalDeaths;

        if (character.realmPointsLastWeek !== character.totalRealmPoints) {
          realmPointsLastWeek += character.realmPointsLastWeek;
        }
        if (character.soloKillsLastWeek !== character.totalSoloKills) {
          soloKillsLastWeek += character.soloKillsLastWeek;
        }
        if (character.deathsLastWeek !== character.totalDeaths) {
          deathsLastWeek += character.deathsLastWeek;
        }

        if (
          character.lastUpdated &&
          (!latestUpdate || character.lastUpdated > latestUpdate)
        ) {
          latestUpdate = character.lastUpdated;
        }
      });

      const irs =
        totalDeaths > 0 ? Math.round(totalPoints / totalDeaths) : totalPoints;

      const irsLastWeek =
        deathsLastWeek > 0
          ? Math.round(realmPointsLastWeek / deathsLastWeek)
          : realmPointsLastWeek;

      const userStats = {
        userName: userData.name,
        totalRealmPoints: totalPoints,
        totalSoloKills: totalSoloKills,
        totalDeaths: totalDeaths,
        deathsLastWeek: deathsLastWeek,
        realmPointsLastWeek: realmPointsLastWeek,
        soloKillsLastWeek: soloKillsLastWeek,
        irs: irs,
        irsLastWeek: irsLastWeek,
      };

      res.status(200).json(userStats);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      res.status(500).json({ message: "Error fetching user stats" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
