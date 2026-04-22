import { formatRealmRankWithLevel, getRealmRankForPoints } from "@/utils/character";

type UserCharactersByUserIdDeps = {
  getUserCharactersByUserId: (clerkUserId: string) => Promise<any[]>;
};

type UserCharactersByUserIdInput = {
  method: string;
  userId: string | null;
};

type UserCharactersByUserIdApiResult =
  | { status: number; headers?: Record<string, string>; body: unknown; bodyType: "json" }
  | { status: number; headers?: Record<string, string>; body: string; bodyType: "text" };

export async function handleUserCharactersByUserIdApi(
  input: UserCharactersByUserIdInput,
  deps: UserCharactersByUserIdDeps
): Promise<UserCharactersByUserIdApiResult> {
  if (!input.userId) {
    return { status: 400, body: { error: "Invalid userId" }, bodyType: "json" };
  }

  if (input.method !== "GET") {
    return {
      status: 405,
      headers: { Allow: "GET" },
      body: `Method ${input.method} Not Allowed`,
      bodyType: "text",
    };
  }

  try {
    const userCharacters = await deps.getUserCharactersByUserId(input.userId);
    const headers = {
      "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
    };

    if (!userCharacters || userCharacters.length === 0) {
      return { status: 200, headers, body: [], bodyType: "json" };
    }

    const charactersWithDetails = userCharacters
      .map((userCharacter) => {
        if (!userCharacter.character) {
          return null;
        }

        const { character } = userCharacter;
        const resolvedClerkUserId =
          userCharacter?.clerkUserId && typeof userCharacter.clerkUserId === "string"
            ? userCharacter.clerkUserId
            : input.userId;
        const heraldRealmPoints = character.heraldRealmPoints ?? 0;
        const formattedHeraldRealmPoints = formatRealmRankWithLevel(
          getRealmRankForPoints(heraldRealmPoints)
        );

        return {
          id: character.id,
          webId: character.webId,
          characterName: character.characterName,
          className: character.className,
          realm: character.realm,
          previousCharacterName: character.previousCharacterName,
          totalRealmPoints: character.totalRealmPoints,
          realmPointsLastWeek: character.realmPointsLastWeek,
          totalKills: character.totalKills,
          killsLastWeek: character.killsLastWeek,
          totalSoloKills: character.totalSoloKills,
          soloKillsLastWeek: character.soloKillsLastWeek,
          totalDeaths: character.totalDeaths,
          deathsLastWeek: character.deathsLastWeek,
          totalDeathBlows: character.totalDeathBlows,
          deathBlowsLastWeek: character.deathBlowsLastWeek,
          lastUpdated: character.lastUpdated,
          nameLastUpdated: character.nameLastUpdated,
          heraldCharacterWebId: character.heraldCharacterWebId,
          heraldName: character.heraldName,
          heraldServerName: character.heraldServerName,
          heraldRealm: character.heraldRealm,
          heraldRace: character.heraldRace,
          heraldClassName: character.heraldClassName,
          heraldLevel: character.heraldLevel,
          heraldGuildName: character.heraldGuildName,
          heraldRealmPoints: character.heraldRealmPoints,
          heraldBountyPoints: character.heraldBountyPoints,
          heraldMasterLevel: character.heraldMasterLevel,
          heraldTotalKills: character.heraldTotalKills,
          heraldTotalDeaths: character.heraldTotalDeaths,
          heraldTotalDeathBlows: character.heraldTotalDeathBlows,
          heraldTotalSoloKills: character.heraldTotalSoloKills,
          heraldAlbionKills: character.heraldAlbionKills,
          heraldAlbionDeaths: character.heraldAlbionDeaths,
          heraldAlbionDeathBlows: character.heraldAlbionDeathBlows,
          heraldAlbionSoloKills: character.heraldAlbionSoloKills,
          heraldMidgardKills: character.heraldMidgardKills,
          heraldMidgardDeaths: character.heraldMidgardDeaths,
          heraldMidgardDeathBlows: character.heraldMidgardDeathBlows,
          heraldMidgardSoloKills: character.heraldMidgardSoloKills,
          heraldHiberniaKills: character.heraldHiberniaKills,
          heraldHiberniaDeaths: character.heraldHiberniaDeaths,
          heraldHiberniaDeathBlows: character.heraldHiberniaDeathBlows,
          heraldHiberniaSoloKills: character.heraldHiberniaSoloKills,
          clerkUserId: resolvedClerkUserId,
          formattedHeraldRealmPoints,
          initialCharacter: {
            id: character.id,
            userId: resolvedClerkUserId,
            webId: character.webId,
          },
          player_kills: {
            total: {
              kills: character.heraldTotalKills || 0,
              deaths: character.heraldTotalDeaths || 0,
              death_blows: character.heraldTotalDeathBlows || 0,
              solo_kills: character.heraldTotalSoloKills || 0,
            },
            midgard: {
              kills: character.heraldMidgardKills || 0,
              deaths: character.heraldMidgardDeaths || 0,
              death_blows: character.heraldMidgardDeathBlows || 0,
              solo_kills: character.heraldMidgardSoloKills || 0,
            },
            albion: {
              kills: character.heraldAlbionKills || 0,
              deaths: character.heraldAlbionDeaths || 0,
              death_blows: character.heraldAlbionDeathBlows || 0,
              solo_kills: character.heraldAlbionSoloKills || 0,
            },
            hibernia: {
              kills: character.heraldHiberniaKills || 0,
              deaths: character.heraldHiberniaDeaths || 0,
              death_blows: character.heraldHiberniaDeathBlows || 0,
              solo_kills: character.heraldHiberniaSoloKills || 0,
            },
          },
        };
      })
      .filter(Boolean);

    return { status: 200, headers, body: charactersWithDetails, bodyType: "json" };
  } catch (error) {
    console.error("Error in /api/userCharactersByUserId:", error);
    if (error instanceof Error) {
      return { status: 500, body: { message: error.message }, bodyType: "json" };
    }
    return { status: 500, body: { message: "An unknown error occurred" }, bodyType: "json" };
  }
}

export type { UserCharactersByUserIdDeps };
