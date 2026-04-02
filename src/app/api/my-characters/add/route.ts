import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import prisma from "../../../../../prisma/prismaClient";

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

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const webIds = body?.webIds;
  if (!Array.isArray(webIds)) {
    return NextResponse.json(
      { error: "Expected an array of webIds." },
      { status: 400 }
    );
  }

  try {
    const characterDetails = await Promise.all(webIds.map(fetchCharacterDetails));
    const characters = await Promise.all(
      characterDetails.map((char) =>
        prisma.character.upsert({
          where: { webId: char.character_web_id },
          update: mapCharacterData(char),
          create: mapCharacterData(char),
        })
      )
    );

    await Promise.all(
      characters.map((character) =>
        prisma.userCharacter.upsert({
          where: {
            clerkUserId_characterId: {
              clerkUserId,
              characterId: character.id,
            },
          },
          update: {},
          create: {
            clerkUserId,
            characterId: character.id,
          },
        })
      )
    );

    revalidateTag("public-user-characters");
    const response = NextResponse.json(characters, { status: 201 });
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return response;
  } catch (error: any) {
    console.error(`Failed to process characters: ${error}`);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
