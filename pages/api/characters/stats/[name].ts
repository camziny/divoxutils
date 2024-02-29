import prisma from "../../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const apiSecret = process.env.DISCORD_BOT_API_KEY;
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== apiSecret) {
    res.status(401).json({ message: "Invalid or missing API key." });
    return;
  }
  if (req.method === "GET") {
    const { name } = req.query;

    try {
      const characterData = await prisma.character.findFirst({
        where: {
          characterName: {
            equals: name?.toString(),
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          characterName: true,
          className: true,
          realm: true,
          totalRealmPoints: true,
          totalSoloKills: true,
          totalDeaths: true,
          deathsLastWeek: true,
          realmPointsLastWeek: true,
          soloKillsLastWeek: true,
          lastUpdated: true,
        },
      });

      if (!characterData) {
        return res.status(404).json({ message: "Character not found" });
      }

      const irs =
        characterData.totalDeaths > 0
          ? Math.round(
              characterData.totalRealmPoints / characterData.totalDeaths
            )
          : characterData.totalRealmPoints;

      const irsLastWeek =
        characterData.deathsLastWeek > 0
          ? Math.round(
              characterData.realmPointsLastWeek / characterData.deathsLastWeek
            )
          : characterData.realmPointsLastWeek;

      const realmRank = getRealmRankForPoints(characterData.totalRealmPoints);
      const formattedRank = formatRealmRankWithLevel(realmRank);

      const characterStats = {
        characterName: characterData.characterName,
        className: characterData.className,
        formattedRank,
        totalSoloKills: characterData.totalSoloKills,
        totalDeaths: characterData.totalDeaths,
        deathsLastWeek: characterData.deathsLastWeek,
        realmPointsLastWeek: characterData.realmPointsLastWeek,
        soloKillsLastWeek: characterData.soloKillsLastWeek,
        irs: irs,
        irsLastWeek: irsLastWeek,
      };

      res.status(200).json(characterStats);
    } catch (error) {
      console.error("Failed to fetch character stats:", error);
      res.status(500).json({ message: "Error fetching character stats" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
