import { NextApiRequest, NextApiResponse } from "next";
import * as userCharacterController from "../../../src/controllers/userCharacterController";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "../../../src/utils/character";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Invalid userId" });
  }

  switch (req.method) {
    case "GET":
      try {
        const userCharacters = await userCharacterController.getUserCharactersByUserId(userId);
        
        // Set cache headers for better performance
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=59');
        
        if (!userCharacters || userCharacters.length === 0) {
          return res.status(200).json([]);
        }

        const charactersWithDetails = userCharacters
          .map((userCharacter) => {
            if (!userCharacter.character) {
              return null;
            }

            const { character, user } = userCharacter;
            const heraldRealmPoints = character.heraldRealmPoints ?? 0;
            const formattedHeraldRealmPoints = formatRealmRankWithLevel(
              getRealmRankForPoints(heraldRealmPoints)
            );

            return {
              id: character.id,
              webId: character.webId,
              characterName: character.characterName,
              className: character.className,
              realm: character.realm,
              previousCharacterName: character.previousCharacterName,
              totalRealmPoints: character.totalRealmPoints,
              realmPointsLastWeek: character.realmPointsLastWeek,
              totalSoloKills: character.totalSoloKills,
              soloKillsLastWeek: character.soloKillsLastWeek,
              totalDeaths: character.totalDeaths,
              deathsLastWeek: character.deathsLastWeek,
              lastUpdated: character.lastUpdated,
              nameLastUpdated: character.nameLastUpdated,
              heraldCharacterWebId: character.heraldCharacterWebId,
              heraldName: character.heraldName,
              heraldServerName: character.heraldServerName,
              heraldRealm: character.heraldRealm,
              heraldRace: character.heraldRace,
              heraldClassName: character.heraldClassName,
              heraldLevel: character.heraldLevel,
              heraldGuildName: character.heraldGuildName,
              heraldRealmPoints: character.heraldRealmPoints,
              heraldBountyPoints: character.heraldBountyPoints,
              heraldMasterLevel: character.heraldMasterLevel,
              heraldTotalKills: character.heraldTotalKills,
              heraldTotalDeaths: character.heraldTotalDeaths,
              heraldTotalDeathBlows: character.heraldTotalDeathBlows,
              heraldTotalSoloKills: character.heraldTotalSoloKills,
              heraldAlbionKills: character.heraldAlbionKills,
              heraldAlbionDeaths: character.heraldAlbionDeaths,
              heraldAlbionDeathBlows: character.heraldAlbionDeathBlows,
              heraldAlbionSoloKills: character.heraldAlbionSoloKills,
              heraldMidgardKills: character.heraldMidgardKills,
              heraldMidgardDeaths: character.heraldMidgardDeaths,
              heraldMidgardDeathBlows: character.heraldMidgardDeathBlows,
              heraldMidgardSoloKills: character.heraldMidgardSoloKills,
              heraldHiberniaKills: character.heraldHiberniaKills,
              heraldHiberniaDeaths: character.heraldHiberniaDeaths,
              heraldHiberniaDeathBlows: character.heraldHiberniaDeathBlows,
              heraldHiberniaSoloKills: character.heraldHiberniaSoloKills,
              clerkUserId: user.clerkUserId,
              formattedHeraldRealmPoints,
              initialCharacter: {
                id: character.id,
                userId: user.clerkUserId,
                webId: character.webId,
              },
              player_kills: {
                total: {
                  kills: character.heraldTotalKills || 0,
                  deaths: character.heraldTotalDeaths || 0,
                  death_blows: character.heraldTotalDeathBlows || 0,
                  solo_kills: character.heraldTotalSoloKills || 0,
                },
                midgard: {
                  kills: character.heraldMidgardKills || 0,
                  deaths: character.heraldMidgardDeaths || 0,
                  death_blows: character.heraldMidgardDeathBlows || 0,
                  solo_kills: character.heraldMidgardSoloKills || 0,
                },
                albion: {
                  kills: character.heraldAlbionKills || 0,
                  deaths: character.heraldAlbionDeaths || 0,
                  death_blows: character.heraldAlbionDeathBlows || 0,
                  solo_kills: character.heraldAlbionSoloKills || 0,
                },
                hibernia: {
                  kills: character.heraldHiberniaKills || 0,
                  deaths: character.heraldHiberniaDeaths || 0,
                  death_blows: character.heraldHiberniaDeathBlows || 0,
                  solo_kills: character.heraldHiberniaSoloKills || 0,
                },
              },
            };
          })
          .filter(Boolean);

        res.status(200).json(charactersWithDetails);
      } catch (error) {
        console.error("Error in /api/userCharactersByUserId:", error);
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred" });
        }
      }
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
