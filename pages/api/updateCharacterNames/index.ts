import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

interface CharacterNameUpdateData {
  nameLastUpdated: Date;
  characterName?: string;
  previousCharacterName?: string;
  className?: string;
}

export default async function updateCharacterNames(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Received request for updateCharacterNames");
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Authorization failed");
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    const batchSize = 50;
    let updatedCount = 0;
    let failedCount = 0;

    const characters = await prisma.character.findMany({
      take: batchSize,
    });

    console.log(`Found ${characters.length} characters to update`);

    for (const character of characters) {
      try {
        const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
        console.log("Fetching data for character:", character.webId);
        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log("Data received for character:", data);

        const fullName = data.name;
        const firstName = fullName.split(" ")[0];
        const className = data.class_name;

        let nameUpdateData: CharacterNameUpdateData = {
          nameLastUpdated: new Date(),
        };

        if (firstName && firstName !== character.characterName) {
          nameUpdateData.characterName = firstName;
          nameUpdateData.previousCharacterName = character.characterName;
        }

        if (className && className !== character.className) {
          nameUpdateData.className = className;
        }

        if (Object.keys(nameUpdateData).length > 1) {
          await prisma.character.update({
            where: { id: character.id },
            data: nameUpdateData,
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Failed to update character ${character.webId}:`, error);
        failedCount++;
      }
    }

    console.log("Update process completed");

    res.status(200).json({
      message: "Character names update process completed",
      updatedCharacters: updatedCount,
      failedUpdates: failedCount,
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
