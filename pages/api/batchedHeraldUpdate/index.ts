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
    let checkedCount = 0;
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
        checkedCount++;
        try {
          const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (data && data.realm_war_stats && data.realm_war_stats.current) {
            const updateData: any = {};

            if (
              data.character_web_id !== undefined &&
              character.heraldCharacterWebId !== data.character_web_id
            ) {
              updateData.heraldCharacterWebId = data.character_web_id;
            }
            if (data.name !== undefined && character.heraldName !== data.name) {
              updateData.heraldName = data.name;
            }
            if (
              data.server_name !== undefined &&
              character.heraldServerName !== data.server_name
            ) {
              updateData.heraldServerName = data.server_name;
            }
            if (
              data.realm !== undefined &&
              character.heraldRealm !== data.realm
            ) {
              updateData.heraldRealm = data.realm;
            }
            if (data.race !== undefined && character.heraldRace !== data.race) {
              updateData.heraldRace = data.race;
            }
            if (
              data.class_name !== undefined &&
              character.heraldClassName !== data.class_name
            ) {
              updateData.heraldClassName = data.class_name;
            }
            if (
              data.level !== undefined &&
              character.heraldLevel !== data.level
            ) {
              updateData.heraldLevel = data.level;
            }
            if (
              data.guild_info?.guild_name !== undefined &&
              character.heraldGuildName !== data.guild_info?.guild_name
            ) {
              updateData.heraldGuildName = data.guild_info?.guild_name;
            }
            if (
              data.realm_war_stats?.current?.realm_points !== undefined &&
              character.heraldRealmPoints !==
                data.realm_war_stats?.current?.realm_points
            ) {
              updateData.heraldRealmPoints =
                data.realm_war_stats?.current?.realm_points;
            }
            if (
              data.realm_war_stats?.current?.bounty_points !== undefined &&
              character.heraldBountyPoints !==
                data.realm_war_stats?.current?.bounty_points
            ) {
              updateData.heraldBountyPoints =
                data.realm_war_stats?.current?.bounty_points;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.total?.kills !==
                undefined &&
              character.heraldTotalKills !==
                data.realm_war_stats?.current?.player_kills?.total?.kills
            ) {
              updateData.heraldTotalKills =
                data.realm_war_stats?.current?.player_kills?.total?.kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.total?.deaths !==
                undefined &&
              character.heraldTotalDeaths !==
                data.realm_war_stats?.current?.player_kills?.total?.deaths
            ) {
              updateData.heraldTotalDeaths =
                data.realm_war_stats?.current?.player_kills?.total?.deaths;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.total
                ?.death_blows !== undefined &&
              character.heraldTotalDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.total?.death_blows
            ) {
              updateData.heraldTotalDeathBlows =
                data.realm_war_stats?.current?.player_kills?.total?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.total?.solo_kills !==
                undefined &&
              character.heraldTotalSoloKills !==
                data.realm_war_stats?.current?.player_kills?.total?.solo_kills
            ) {
              updateData.heraldTotalSoloKills =
                data.realm_war_stats?.current?.player_kills?.total?.solo_kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.midgard?.kills !==
                undefined &&
              character.heraldMidgardKills !==
                data.realm_war_stats?.current?.player_kills?.midgard?.kills
            ) {
              updateData.heraldMidgardKills =
                data.realm_war_stats?.current?.player_kills?.midgard?.kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.midgard?.deaths !==
                undefined &&
              character.heraldMidgardDeaths !==
                data.realm_war_stats?.current?.player_kills?.midgard?.deaths
            ) {
              updateData.heraldMidgardDeaths =
                data.realm_war_stats?.current?.player_kills?.midgard?.deaths;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.midgard
                ?.death_blows !== undefined &&
              character.heraldMidgardDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.midgard
                  ?.death_blows
            ) {
              updateData.heraldMidgardDeathBlows =
                data.realm_war_stats?.current?.player_kills?.midgard?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.midgard
                ?.solo_kills !== undefined &&
              character.heraldMidgardSoloKills !==
                data.realm_war_stats?.current?.player_kills?.midgard?.solo_kills
            ) {
              updateData.heraldMidgardSoloKills =
                data.realm_war_stats?.current?.player_kills?.midgard?.solo_kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.albion?.kills !==
                undefined &&
              character.heraldAlbionKills !==
                data.realm_war_stats?.current?.player_kills?.albion?.kills
            ) {
              updateData.heraldAlbionKills =
                data.realm_war_stats?.current?.player_kills?.albion?.kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.albion?.deaths !==
                undefined &&
              character.heraldAlbionDeaths !==
                data.realm_war_stats?.current?.player_kills?.albion?.deaths
            ) {
              updateData.heraldAlbionDeaths =
                data.realm_war_stats?.current?.player_kills?.albion?.deaths;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.albion
                ?.death_blows !== undefined &&
              character.heraldAlbionDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.albion?.death_blows
            ) {
              updateData.heraldAlbionDeathBlows =
                data.realm_war_stats?.current?.player_kills?.albion?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.albion
                ?.solo_kills !== undefined &&
              character.heraldAlbionSoloKills !==
                data.realm_war_stats?.current?.player_kills?.albion?.solo_kills
            ) {
              updateData.heraldAlbionSoloKills =
                data.realm_war_stats?.current?.player_kills?.albion?.solo_kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.hibernia?.kills !==
                undefined &&
              character.heraldHiberniaKills !==
                data.realm_war_stats?.current?.player_kills?.hibernia?.kills
            ) {
              updateData.heraldHiberniaKills =
                data.realm_war_stats?.current?.player_kills?.hibernia?.kills;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.hibernia?.deaths !==
                undefined &&
              character.heraldHiberniaDeaths !==
                data.realm_war_stats?.current?.player_kills?.hibernia?.deaths
            ) {
              updateData.heraldHiberniaDeaths =
                data.realm_war_stats?.current?.player_kills?.hibernia?.deaths;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.hibernia
                ?.death_blows !== undefined &&
              character.heraldHiberniaDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.hibernia
                  ?.death_blows
            ) {
              updateData.heraldHiberniaDeathBlows =
                data.realm_war_stats?.current?.player_kills?.hibernia?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.hibernia
                ?.solo_kills !== undefined &&
              character.heraldHiberniaSoloKills !==
                data.realm_war_stats?.current?.player_kills?.hibernia
                  ?.solo_kills
            ) {
              updateData.heraldHiberniaSoloKills =
                data.realm_war_stats?.current?.player_kills?.hibernia?.solo_kills;
            }
            if (
              `${data.master_level?.level} ${data.master_level?.path}` !==
                undefined &&
              character.heraldMasterLevel !==
                `${data.master_level?.level} ${data.master_level?.path}`
            ) {
              updateData.heraldMasterLevel = `${data.master_level?.level} ${data.master_level?.path}`;
            }

            if (Object.keys(updateData).length > 0) {
              await prisma.character.update({
                where: { id: character.id },
                data: updateData,
              });
              updatedCount++;
            }
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
        checkedCharacters: checkedCount,
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
