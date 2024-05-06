import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getLastProcessedHeraldCharacterId,
  updateLastProcessedHeraldCharacterId,
} from "@/controllers/batchStateController";

export default async function batchedHeraldUpdate(
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

    try {
      const lastProcessedId = await getLastProcessedHeraldCharacterId(prisma);
      const characters = await prisma.character.findMany({
        where: {
          id: { gt: lastProcessedId },
        },
        take: batchSize,
        orderBy: { id: "asc" },
      });

      for (const character of characters) {
        try {
          const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (data && data.realm_war_stats && data.realm_war_stats.current) {
            await prisma.character.update({
              where: { id: character.id },
              data: {
                heraldCharacterWebId: data.character_web_id,
                heraldName: data.name,
                heraldServerName: data.server_name,
                heraldRealm: data.realm,
                heraldRace: data.race,
                heraldClassName: data.class_name,
                heraldLevel: data.level,
                heraldGuildName: data.guild_info?.guild_name,
                heraldRealmPoints: data.realm_war_stats?.current?.realm_points,
                heraldBountyPoints:
                  data.realm_war_stats?.current?.bounty_points,
                heraldTotalKills:
                  data.realm_war_stats?.current?.player_kills?.total?.kills,
                heraldTotalDeaths:
                  data.realm_war_stats?.current?.player_kills?.total?.deaths,
                heraldTotalDeathBlows:
                  data.realm_war_stats?.current?.player_kills?.total
                    ?.death_blows,
                heraldTotalSoloKills:
                  data.realm_war_stats?.current?.player_kills?.total
                    ?.solo_kills,
                heraldMidgardKills:
                  data.realm_war_stats?.current?.player_kills?.midgard?.kills,
                heraldMidgardDeaths:
                  data.realm_war_stats?.current?.player_kills?.midgard?.deaths,
                heraldMidgardDeathBlows:
                  data.realm_war_stats?.current?.player_kills?.midgard
                    ?.death_blows,
                heraldMidgardSoloKills:
                  data.realm_war_stats?.current?.player_kills?.midgard
                    ?.solo_kills,
                heraldAlbionKills:
                  data.realm_war_stats?.current?.player_kills?.albion?.kills,
                heraldAlbionDeaths:
                  data.realm_war_stats?.current?.player_kills?.albion?.deaths,
                heraldAlbionDeathBlows:
                  data.realm_war_stats?.current?.player_kills?.albion
                    ?.death_blows,
                heraldAlbionSoloKills:
                  data.realm_war_stats?.current?.player_kills?.albion
                    ?.solo_kills,
                heraldHiberniaKills:
                  data.realm_war_stats?.current?.player_kills?.hibernia?.kills,
                heraldHiberniaDeaths:
                  data.realm_war_stats?.current?.player_kills?.hibernia?.deaths,
                heraldHiberniaDeathBlows:
                  data.realm_war_stats?.current?.player_kills?.hibernia
                    ?.death_blows,
                heraldHiberniaSoloKills:
                  data.realm_war_stats?.current?.player_kills?.hibernia
                    ?.solo_kills,
                heraldMasterLevel: `${data.master_level?.level} ${data.master_level?.path}`,
              },
            });
            updatedCount++;
          }
        } catch (error) {
          console.error(
            `Failed to update character ${character.webId}:`,
            error
          );
          failedCount++;
        }
      }

      if (characters.length > 0) {
        const newLastProcessedId = characters[characters.length - 1].id;
        await updateLastProcessedHeraldCharacterId(prisma, newLastProcessedId);
      }

      res.status(200).json({
        message: "Batch update process completed",
        updatedCharacters: updatedCount,
        failedUpdates: failedCount,
      });
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
