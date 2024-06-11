import { NextApiRequest, NextApiResponse } from "next";
import {
  getUserCharactersByUserName,
  getAllUserNames,
} from "@/controllers/userCharacterController";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";
import {
  characterClassesByClassType,
  characterClassesByRealm,
  Realm,
  ClassType,
} from "@/utils/group";
import { findClosestMatch } from "@/utils/levenshtein";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const apiSecret = process.env.DISCORD_BOT_API_KEY;
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== apiSecret) {
    res.status(401).json({ message: "Invalid or missing API key." });
    return;
  }

  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const { name, realm, classType } = req.query;
  const typedName = typeof name === "string" ? name : "";
  const allUserNames = await getAllUserNames();
  const closestUserName = findClosestMatch(typedName, allUserNames);
  const typedClassType = classType as ClassType | undefined;
  const realmAbbreviations: Record<string, string> = {
    mid: "Midgard",
    alb: "Albion",
    hib: "Hibernia",
  };
  const typedRealm =
    typeof realm === "string"
      ? realmAbbreviations[realm.toLowerCase()] || realm
      : undefined;

  if (!name || typeof name !== "string") {
    res.status(400).json({ message: "User name must be a string." });
    return;
  }

  if (closestUserName === null) {
    return res.status(404).json({ message: `User ${typedName} not found` });
  }

  switch (req.method) {
    case "GET":
      try {
        const userCharacters = await getUserCharactersByUserName(
          closestUserName
        );
        if (userCharacters && userCharacters.length > 0) {
          const filteredCharacters = userCharacters.filter((character) => {
            const isRealmMatch = typedRealm
              ? character.realm.toLowerCase() === typedRealm.toLowerCase()
              : true;
            const isTypeMatch = typedClassType
              ? characterClassesByClassType[
                  capitalizeFirstLetter(typedClassType) as ClassType
                ].includes(character.className)
              : true;

            return isRealmMatch && isTypeMatch;
          });

          const sortedAndFormattedCharacters = filteredCharacters
            .sort((a, b) => b.totalRealmPoints - a.totalRealmPoints)
            .map((character) => {
              const realmRank = getRealmRankForPoints(
                character.totalRealmPoints
              );
              const formattedRank = formatRealmRankWithLevel(realmRank);

              return {
                characterName: character.characterName,
                className: character.className,
                heraldName: character.heraldName,
                formattedRank,
              };
            });

          console.log("API Response Characters:", sortedAndFormattedCharacters);

          res.status(200).json({
            user: `${closestUserName}`,
            characters: sortedAndFormattedCharacters,
          });
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
