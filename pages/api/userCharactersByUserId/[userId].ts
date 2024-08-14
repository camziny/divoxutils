import { NextApiRequest, NextApiResponse } from "next";
import * as userCharacterController from "../../../src/controllers/userCharacterController";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "../../../src/utils/character";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    res.status(400).json({ message: "User ID must be a string." });
    return;
  }

  try {
    const userCharacters =
      await userCharacterController.getUserCharactersByUserId(userId);

    if (!userCharacters || userCharacters.length === 0) {
      console.log(`No characters found for user ID: ${userId}`);
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

        console.log("User Characters:", userCharacters);

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
          clerkUserId: user.clerkUserId,
          formattedHeraldRealmPoints,
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
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
