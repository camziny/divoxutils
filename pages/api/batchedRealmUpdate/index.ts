import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getLastProcessedCharacterId,
  updateLastProcessedCharacterId,
} from "@/controllers/batchStateController";

async function fetchCharacterRealm(webId: string) {
  const apiUrl = `https://api.camelotherald.com/character/info/${webId}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.realm;
  } catch (error) {
    console.error("Failed to fetch character realm for webId:", webId, error);
    return null;
  }
}

export default async function batchedRealmUpdate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    const batchSize = 100;
    let updatedCount = 0;
    let failedCount = 0;

    const lastProcessedId = await getLastProcessedCharacterId(prisma);

    const characters = await prisma.character.findMany({
      where: {
        id: { gt: lastProcessedId },
      },
      take: batchSize,
      orderBy: { id: "asc" },
    });

    for (const character of characters) {
      try {
        const realmId = await fetchCharacterRealm(character.webId);
        const realmName =
          realmId === 1 ? "Albion" : realmId === 2 ? "Midgard" : "Hibernia";
        await prisma.character.update({
          where: { id: character.id },
          data: { realm: realmName },
        });
        updatedCount++;
      } catch (error) {
        console.error(
          `Failed to update realm for character ${character.id}:`,
          error
        );
        failedCount++;
      }
    }

    if (characters.length > 0) {
      const newLastProcessedId = characters[characters.length - 1].id;
      await updateLastProcessedCharacterId(prisma, newLastProcessedId);
    }

    res.status(200).json({
      message: "Batch realm update process completed",
      updatedRealms: updatedCount,
      failedUpdates: failedCount,
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
