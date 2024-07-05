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
                  totalRealmPoints: true,
                  totalSoloKills: true,
                  totalDeaths: true,
                  deathsLastWeek: true,
                  realmPointsLastWeek: true,
                  soloKillsLastWeek: true,
                  lastUpdated: true,
                  heraldRealmPoints: true,
                  heraldTotalDeaths: true,
                  heraldTotalSoloKills: true,
                },
              },
            },
          },
        },
      });

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
        let deathsLastWeek = 0;
        let realmPointsLastWeek = 0;
        let soloKillsLastWeek = 0;
        let latestUpdate: Date | null = null;

        let realmPointsThisWeek = 0;
        let deathsThisWeek = 0;
        let soloKillsThisWeek = 0;
        let irsThisWeek = 0;

        user.characters.forEach((userCharacter) => {
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
          if (
            character.lastUpdated &&
            isWithinThisWeek(new Date(character.lastUpdated))
          ) {
            if (
              character.heraldRealmPoints !== null &&
              character.totalRealmPoints !== null
            ) {
              const rpThisWeek =
                character.heraldRealmPoints - character.totalRealmPoints;
              realmPointsThisWeek += rpThisWeek;

              if (user.id === 1) {
                console.log(`Realm Points This Week Calculation:`);
                console.log(
                  `heraldRealmPoints: ${character.heraldRealmPoints}`
                );
                console.log(`totalRealmPoints: ${character.totalRealmPoints}`);
                console.log(`realmPointsThisWeek: ${rpThisWeek}`);
              }
            }

            if (
              character.heraldTotalDeaths !== null &&
              character.totalDeaths !== null
            ) {
              const deathsThisWeekValue =
                character.heraldTotalDeaths - character.totalDeaths;
              deathsThisWeek += deathsThisWeekValue;

              if (user.id === 1) {
                console.log(`Deaths This Week Calculation:`);
                console.log(
                  `heraldTotalDeaths: ${character.heraldTotalDeaths}`
                );
                console.log(`totalDeaths: ${character.totalDeaths}`);
                console.log(`deathsThisWeek: ${deathsThisWeekValue}`);
              }
            }

            if (
              character.heraldTotalSoloKills !== null &&
              character.totalSoloKills !== null
            ) {
              const skThisWeek =
                character.heraldTotalSoloKills - character.totalSoloKills;
              soloKillsThisWeek += skThisWeek;

              if (user.id === 1) {
                console.log(`Solo Kills This Week Calculation:`);
                console.log(
                  `heraldTotalSoloKills: ${character.heraldTotalSoloKills}`
                );
                console.log(`totalSoloKills: ${character.totalSoloKills}`);
                console.log(`soloKillsThisWeek: ${skThisWeek}`);
              }
            }
          } else {
            if (user.id === 1) {
              console.log(
                `Character ${character.id} is NOT updated this week.`
              );
            }
          }
        });

        realmPointsThisWeek = Math.max(0, realmPointsThisWeek);
        deathsThisWeek = Math.max(0, deathsThisWeek);
        soloKillsThisWeek = Math.max(0, soloKillsThisWeek);

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
          deathsLastWeek: deathsLastWeek,
          realmPointsLastWeek: realmPointsLastWeek,
          soloKillsLastWeek: soloKillsLastWeek,
          irs: irs,
          irsLastWeek: irsLastWeek,
          lastUpdated: latestUpdate,
          realmPointsThisWeek: realmPointsThisWeek,
          deathsThisWeek: deathsThisWeek,
          soloKillsThisWeek: soloKillsThisWeek,
          irsThisWeek: irsThisWeek,
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
