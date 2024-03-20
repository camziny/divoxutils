import { NextApiRequest, NextApiResponse } from "next";
import * as userCharacterController from "../../../src/controllers/userCharacterController";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "../../../src/utils/character";

const fetchCharacterDetails = async (characterWebId: string) => {
  const response = await fetch(
    `https://api.camelotherald.com/character/info/${characterWebId}`
  );
  const data = await response.json();
  return data;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    res.status(400).json({ message: "User ID must be a string." });
    return;
  }

  try {
    const userCharacters =
      await userCharacterController.getUserCharactersByUserId(userId);
    if (userCharacters && userCharacters.length) {
      const charactersWithDetails = await Promise.all(
        userCharacters.map(async (userCharacter) => {
          const characterDetails = await fetchCharacterDetails(
            userCharacter.character.webId
          );
          const formattedRealmPoints = formatRealmRankWithLevel(
            getRealmRankForPoints(
              characterDetails.realm_war_stats.current.realm_points
            )
          );
          return {
            ...userCharacter,
            characterDetails: {
              name: characterDetails.name,
              race: characterDetails.race,
              class_name: characterDetails.class_name,
              level: characterDetails.level,
              guild_name: characterDetails.guild_info?.guild_name,
              realm_points:
                characterDetails.realm_war_stats.current.realm_points,
              formattedRealmPoints,
              player_kills:
                characterDetails.realm_war_stats.current.player_kills,
            },
          };
        })
      );
      res.status(200).json({ userCharacters: charactersWithDetails });
    } else {
      res.status(404).json({ message: "No characters found for the user." });
    }
  } catch (error) {
    console.error("Error in /api/userCharactersByUserId:", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
