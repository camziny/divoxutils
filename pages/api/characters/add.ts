import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";

const realmMapping: Record<number, string> = {
  1: "Albion",
  2: "Midgard",
  3: "Hibernia",
};

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

function mapCharacterData(char: any) {
  return {
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
    heraldGuildName: char.guild_info?.guild_name || char.guild_name || null,
    heraldRealmPoints: char.realm_war_stats.current.realm_points,
    heraldBountyPoints: char.realm_war_stats.current.bounty_points,
    heraldTotalKills: char.realm_war_stats.current.player_kills.total.kills,
    heraldTotalDeaths: char.realm_war_stats.current.player_kills.total.deaths,
    heraldTotalDeathBlows:
      char.realm_war_stats.current.player_kills.total.death_blows,
    heraldTotalSoloKills:
      char.realm_war_stats.current.player_kills.total.solo_kills,
    totalRealmPoints: char.realm_war_stats.current.realm_points,
    totalSoloKills: char.realm_war_stats.current.player_kills.total.solo_kills,
    totalDeaths: char.realm_war_stats.current.player_kills.total.deaths,
    totalDeathBlows: char.realm_war_stats.current.player_kills.total.death_blows,
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
}

function createUpsertCharacter(prismaClient: any) {
  return async (char: any) => {
    const characterData = {
      ...mapCharacterData(char),
    };

    return prismaClient.character.upsert({
      where: { webId: char.character_web_id },
      update: characterData,
      create: characterData,
    });
  };
}

type AddCharactersDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  findUserByClerkId: (clerkUserId: string) => Promise<{ id: number } | null>;
  fetchCharacterDetailsByWebId: (webId: string) => Promise<any>;
  upsertCharacterFromDetails: (char: any) => Promise<{ id: number }>;
  upsertUserCharacterLink: (
    clerkUserId: string,
    characterId: number
  ) => Promise<unknown>;
};

export const createAddCharactersHandler =
  (deps: AddCharactersDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const clerkUserId = deps.getAuthUserId(req);

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await deps.findUserByClerkId(clerkUserId);
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
        webIds.map(deps.fetchCharacterDetailsByWebId)
      );

      const characters = await Promise.all(
        characterDetails.map(deps.upsertCharacterFromDetails)
      );

      await Promise.all(
        characters.map((character) =>
          deps.upsertUserCharacterLink(clerkUserId, character.id)
        )
      );

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(201).json(characters);
    } catch (error: any) {
      console.error(`Failed to process characters: ${error}`);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  };

const handler = createAddCharactersHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  findUserByClerkId: (clerkUserId) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
  },
  fetchCharacterDetailsByWebId: fetchCharacterDetails,
  upsertCharacterFromDetails: (char) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return createUpsertCharacter(prismaClient)(char);
  },
  upsertUserCharacterLink: (clerkUserId, characterId) => {
    const prismaClient = require("../../../prisma/prismaClient").default;
    return prismaClient.userCharacter.upsert({
      where: {
        clerkUserId_characterId: {
          clerkUserId,
          characterId,
        },
      },
      update: {},
      create: {
        clerkUserId,
        characterId,
      },
    });
  },
});

export default handler;
