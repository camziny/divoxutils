import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type LeaderboardStatsCharacter = {
  webId: string;
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  totalDeathBlows: number;
};

type UpdateLeaderboardStatsDeps = {
  cronSecret: string | undefined;
  findCharacters: (args: { skip: number; take: number }) => Promise<LeaderboardStatsCharacter[]>;
  updateCharacterByWebId: (args: {
    webId: string;
    data: {
      totalRealmPoints: number;
      realmPointsLastWeek: number;
      totalSoloKills: number;
      soloKillsLastWeek: number;
      totalDeaths: number;
      deathsLastWeek: number;
      totalDeathBlows: number;
      deathBlowsLastWeek: number;
    };
  }) => Promise<void>;
  fetchImpl: typeof fetch;
};

export function createUpdateLeaderboardStatsRouteHandlers(
  deps: UpdateLeaderboardStatsDeps
) {
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

    let skip = 0;
    const batchSize = 50;
    while (true) {
      const characters = await deps.findCharacters({
        skip,
        take: batchSize,
      });

      if (characters.length === 0) {
        break;
      }

      for (const character of characters) {
        try {
          const apiUrl = `https://api.camelotherald.com/character/info/${character.webId}`;
          const response = await deps.fetchImpl(apiUrl);
          const data = (await response.json()) as {
            realm_war_stats?: {
              current?: {
                realm_points: number;
                player_kills: {
                  total: {
                    solo_kills: number;
                    deaths: number;
                    death_blows: number;
                  };
                };
              };
            };
          };

          if (data && data.realm_war_stats && data.realm_war_stats.current) {
            const currentStats = data.realm_war_stats.current;
            const realmPointsLastWeek = Math.max(
              0,
              currentStats.realm_points - character.totalRealmPoints
            );
            const soloKillsLastWeek = Math.max(
              0,
              currentStats.player_kills.total.solo_kills - character.totalSoloKills
            );
            const deathsLastWeek = Math.max(
              0,
              currentStats.player_kills.total.deaths - character.totalDeaths
            );
            const deathBlowsLastWeek = Math.max(
              0,
              currentStats.player_kills.total.death_blows - character.totalDeathBlows
            );

            await deps.updateCharacterByWebId({
              webId: character.webId,
              data: {
                totalRealmPoints: currentStats.realm_points,
                realmPointsLastWeek,
                totalSoloKills: currentStats.player_kills.total.solo_kills,
                soloKillsLastWeek,
                totalDeaths: currentStats.player_kills.total.deaths,
                deathsLastWeek,
                totalDeathBlows: currentStats.player_kills.total.death_blows,
                deathBlowsLastWeek,
              },
            });
          }
        } catch (error) {
          console.error(
            `Failed to update stats for character ${character.webId}:`,
            error
          );
        }
      }

      skip += batchSize;
    }

    return NextResponse.json({
      message: "Leaderboard stats updated successfully",
    });
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
