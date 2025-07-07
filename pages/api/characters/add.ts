import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "../../../prisma/prismaClient";
import fetch from "node-fetch";
import { realmMapping } from "@/controllers/characterController";

async function fetchCharacterDetails(webId: string) {
  const url = `https://api.camelotherald.com/character/info/${webId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `API call failed with status ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
}

async function upsertCharacter(char: any) {
  const characterData = {
    webId: char.character_web_id,
    characterName: char.name,
    className: char.class_name,
    realm: realmMapping[char.realm] || "Unknown",
    heraldCharacterWebId: char.character_web_id,
    heraldName: char.name,
    heraldServerName: char.server_name,
    heraldRealm: char.realm,
    heraldRace: char.race,
    heraldClassName: char.class_name,
    heraldLevel: char.level,
    heraldGuildName: char.guild_name,
    heraldRealmPoints: char.realm_war_stats.current.realm_points,
    heraldBountyPoints: char.realm_war_stats.current.bounty_points,
    heraldTotalKills: char.realm_war_stats.current.player_kills.total.kills,
    heraldTotalDeaths: char.realm_war_stats.current.player_kills.total.deaths,
    heraldTotalDeathBlows:
      char.realm_war_stats.current.player_kills.total.death_blows,
    heraldTotalSoloKills:
      char.realm_war_stats.current.player_kills.total.solo_kills,
    heraldAlbionKills:
      char.realm_war_stats.current.player_kills.albion?.kills ?? 0,
    heraldAlbionDeaths:
      char.realm_war_stats.current.player_kills.albion?.deaths ?? 0,
    heraldAlbionDeathBlows:
      char.realm_war_stats.current.player_kills.albion?.death_blows ?? 0,
    heraldAlbionSoloKills:
      char.realm_war_stats.current.player_kills.albion?.solo_kills ?? 0,
    heraldHiberniaKills:
      char.realm_war_stats.current.player_kills.hibernia?.kills ?? 0,
    heraldHiberniaDeaths:
      char.realm_war_stats.current.player_kills.hibernia?.deaths ?? 0,
    heraldHiberniaDeathBlows:
      char.realm_war_stats.current.player_kills.hibernia?.death_blows ?? 0,
    heraldHiberniaSoloKills:
      char.realm_war_stats.current.player_kills.hibernia?.solo_kills ?? 0,
    heraldMidgardKills:
      char.realm_war_stats.current.player_kills.midgard?.kills ?? 0,
    heraldMidgardDeaths:
      char.realm_war_stats.current.player_kills.midgard?.deaths ?? 0,
    heraldMidgardDeathBlows:
      char.realm_war_stats.current.player_kills.midgard?.death_blows ?? 0,
    heraldMidgardSoloKills:
      char.realm_war_stats.current.player_kills.midgard?.solo_kills ?? 0,
    heraldMasterLevel: char.master_level?.level?.toString() ?? "Unknown",
  };

  return prisma.character.upsert({
    where: { webId: char.character_web_id },
    update: characterData,
    create: characterData,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authDetails = getAuth(req);
  const clerkUserId = authDetails.userId;

  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { webIds } = req.body;

  if (!Array.isArray(webIds)) {
    return res.status(400).json({ error: "Expected an array of webIds." });
  }

  try {
    const characterDetails = await Promise.all(
      webIds.map(fetchCharacterDetails)
    );

    const characters = await Promise.all(characterDetails.map(upsertCharacter));

    await Promise.all(
      characters.map((character) => {
        return prisma.userCharacter.upsert({
          where: {
            clerkUserId_characterId: {
              clerkUserId: clerkUserId,
              characterId: character.id,
            },
          },
          update: {},
          create: {
            clerkUserId: clerkUserId,
            characterId: character.id,
          },
        });
      })
    );

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(201).json(characters);
  } catch (error: any) {
    console.error(`Failed to process characters: ${error}`);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
