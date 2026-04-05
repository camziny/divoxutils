import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type HeraldCharacter = {
  id: number;
  webId: string;
  heraldCharacterWebId: string | null;
  heraldName: string | null;
  heraldServerName: string | null;
  heraldRealm: number | null;
  heraldRace: string | null;
  heraldClassName: string | null;
  heraldLevel: number | null;
  heraldGuildName: string | null;
  heraldRealmPoints: number | null;
  heraldBountyPoints: number | null;
  heraldTotalKills: number | null;
  heraldTotalDeaths: number | null;
  heraldTotalDeathBlows: number | null;
  heraldTotalSoloKills: number | null;
  heraldMidgardKills: number | null;
  heraldMidgardDeaths: number | null;
  heraldMidgardDeathBlows: number | null;
  heraldMidgardSoloKills: number | null;
  heraldAlbionKills: number | null;
  heraldAlbionDeaths: number | null;
  heraldAlbionDeathBlows: number | null;
  heraldAlbionSoloKills: number | null;
  heraldHiberniaKills: number | null;
  heraldHiberniaDeaths: number | null;
  heraldHiberniaDeathBlows: number | null;
  heraldHiberniaSoloKills: number | null;
  heraldMasterLevel: string | null;
};

type HeraldUpdateData = Partial<Omit<HeraldCharacter, "id" | "webId">>;

type HeraldApiData = {
  character_web_id?: string | number;
  name?: string;
  server_name?: string;
  realm?: number;
  race?: string;
  class_name?: string;
  level?: number;
  guild_info?: { guild_name?: string };
  master_level?: { level?: number; path?: string };
  realm_war_stats?: {
    current?: {
      realm_points?: number;
      bounty_points?: number;
      player_kills?: {
        total?: {
          kills?: number;
          deaths?: number;
          death_blows?: number;
          solo_kills?: number;
        };
        midgard?: {
          kills?: number;
          deaths?: number;
          death_blows?: number;
          solo_kills?: number;
        };
        albion?: {
          kills?: number;
          deaths?: number;
          death_blows?: number;
          solo_kills?: number;
        };
        hibernia?: {
          kills?: number;
          deaths?: number;
          death_blows?: number;
          solo_kills?: number;
        };
      };
    };
  };
};

type BatchedHeraldUpdateDeps = {
  cronSecret: string | undefined;
  getLastProcessedHeraldCharacterId: () => Promise<number>;
  updateLastProcessedHeraldCharacterId: (lastId: number) => Promise<void>;
  findCharacters: (args: { lastProcessedId: number; take: number }) => Promise<HeraldCharacter[]>;
  updateCharacter: (args: { id: number; data: HeraldUpdateData }) => Promise<void>;
  fetchImpl: typeof fetch;
};

export function createBatchedHeraldUpdateRouteHandlers(deps: BatchedHeraldUpdateDeps) {
  async function run(method: string, request: NextRequest) {
    if (
      !hasValidCronAuthorization(
        request.headers.get("authorization"),
        deps.cronSecret
      )
    ) {
      return unauthorizedCronResponse();
    }

    if (method !== "POST") {
      return postMethodNotAllowedResponse(method);
    }

    const batchSize = 100;
    let checkedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    try {
      const lastProcessedId = await deps.getLastProcessedHeraldCharacterId();
      const characters = await deps.findCharacters({
        lastProcessedId,
        take: batchSize,
      });

      for (const character of characters) {
        checkedCount++;
        try {
          const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
          const response = await deps.fetchImpl(apiUrl);
          const data = (await response.json()) as HeraldApiData;

          if (data && data.realm_war_stats && data.realm_war_stats.current) {
            const updateData: HeraldUpdateData = {};

            if (
              data.character_web_id !== undefined &&
              data.character_web_id !== null
            ) {
              const heraldCharacterWebId = String(data.character_web_id);
              if (character.heraldCharacterWebId !== heraldCharacterWebId) {
                updateData.heraldCharacterWebId = heraldCharacterWebId;
              }
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
            if (data.realm !== undefined && character.heraldRealm !== data.realm) {
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
            if (data.level !== undefined && character.heraldLevel !== data.level) {
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
              character.heraldRealmPoints !== data.realm_war_stats?.current?.realm_points
            ) {
              updateData.heraldRealmPoints = data.realm_war_stats?.current?.realm_points;
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
              data.realm_war_stats?.current?.player_kills?.total?.death_blows !==
                undefined &&
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
              data.realm_war_stats?.current?.player_kills?.midgard?.death_blows !==
                undefined &&
              character.heraldMidgardDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.midgard?.death_blows
            ) {
              updateData.heraldMidgardDeathBlows =
                data.realm_war_stats?.current?.player_kills?.midgard?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.midgard?.solo_kills !==
                undefined &&
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
              data.realm_war_stats?.current?.player_kills?.albion?.death_blows !==
                undefined &&
              character.heraldAlbionDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.albion?.death_blows
            ) {
              updateData.heraldAlbionDeathBlows =
                data.realm_war_stats?.current?.player_kills?.albion?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.albion?.solo_kills !==
                undefined &&
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
              data.realm_war_stats?.current?.player_kills?.hibernia?.death_blows !==
                undefined &&
              character.heraldHiberniaDeathBlows !==
                data.realm_war_stats?.current?.player_kills?.hibernia?.death_blows
            ) {
              updateData.heraldHiberniaDeathBlows =
                data.realm_war_stats?.current?.player_kills?.hibernia?.death_blows;
            }
            if (
              data.realm_war_stats?.current?.player_kills?.hibernia?.solo_kills !==
                undefined &&
              character.heraldHiberniaSoloKills !==
                data.realm_war_stats?.current?.player_kills?.hibernia?.solo_kills
            ) {
              updateData.heraldHiberniaSoloKills =
                data.realm_war_stats?.current?.player_kills?.hibernia?.solo_kills;
            }
            if (
              data.master_level?.level !== undefined &&
              data.master_level?.path !== undefined
            ) {
              const masterLevelValue = `${data.master_level.level} ${data.master_level.path}`;
              if (character.heraldMasterLevel !== masterLevelValue) {
                updateData.heraldMasterLevel = masterLevelValue;
              }
            }

            if (Object.keys(updateData).length > 0) {
              await deps.updateCharacter({ id: character.id, data: updateData });
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to update character ${character.webId}:`, error);
          failedCount++;
        }
      }

      if (characters.length > 0) {
        const newLastProcessedId = characters[characters.length - 1].id;
        await deps.updateLastProcessedHeraldCharacterId(newLastProcessedId);
      }

      return NextResponse.json({
        message: "Batch update process completed",
        checkedCharacters: checkedCount,
        updatedCharacters: updatedCount,
        failedUpdates: failedCount,
      });
    } catch (error) {
      console.error("Error fetching characters:", error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  }

  return {
    POST: async (request: NextRequest) => run("POST", request),
    GET: async (request: NextRequest) => run("GET", request),
    PUT: async (request: NextRequest) => run("PUT", request),
    PATCH: async (request: NextRequest) => run("PATCH", request),
    DELETE: async (request: NextRequest) => run("DELETE", request),
    OPTIONS: async (request: NextRequest) => run("OPTIONS", request),
    HEAD: async (request: NextRequest) => run("HEAD", request),
  };
}
