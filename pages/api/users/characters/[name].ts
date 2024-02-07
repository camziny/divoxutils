import { NextApiRequest, NextApiResponse } from "next";
import { getUserCharactersByUserName } from "@/controllers/userCharacterController";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const apiSecret = process.env.DISCORD_BOT_API_KEY;

  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== apiSecret) {
    res.status(401).json({ message: "Invalid or missing API key." });
    return;
  }

  const { name } = req.query;

  if (!name || typeof name !== "string") {
    res.status(400).json({ message: "User name must be a string." });
    return;
  }

  const userName = name;

  switch (req.method) {
    case "GET":
      try {
        const userCharacters = await getUserCharactersByUserName(userName);
        if (userCharacters && userCharacters.length > 0) {
          const formattedCharacters = userCharacters.map((character) => {
            const realmRank = getRealmRankForPoints(character.totalRealmPoints);
            const formattedRank = formatRealmRankWithLevel(realmRank);

            return {
              characterName: character.characterName,
              className: character.className,
              formattedRank,
            };
          });

          res.status(200).json(formattedCharacters);
        } else {
          res
            .status(404)
            .json({ message: "No characters found for this user." });
        }
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({ message: error.message });
        } else {
          res.status(500).json({ message: "An unknown error occurred." });
        }
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
