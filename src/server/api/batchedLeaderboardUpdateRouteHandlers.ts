import { NextRequest, NextResponse } from "next/server";
import {
  hasValidCronAuthorization,
  postMethodNotAllowedResponse,
  unauthorizedCronResponse,
} from "@/server/api/cronAuth";

type LeaderboardCharacter = {
  id: number;
  webId: string;
  totalRealmPoints: number;
  totalSoloKills: number;
  totalDeaths: number;
  totalDeathBlows: number;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
  deathsLastWeek: number;
  deathBlowsLastWeek: number;
  lastUpdated: Date | null;
};

type UpdateCharacterData = {
  totalRealmPoints?: number;
  realmPointsLastWeek?: number;
  totalSoloKills?: number;
  soloKillsLastWeek?: number;
  totalDeaths?: number;
  deathsLastWeek?: number;
  totalDeathBlows?: number;
  deathBlowsLastWeek?: number;
  lastUpdated: Date;
};

type BatchedLeaderboardUpdateDeps = {
  cronSecret: string | undefined;
  getLastProcessedCharacterId: () => Promise<number>;
  updateLastProcessedCharacterId: (lastId: number) => Promise<void>;
  findCharacters: (args: { lastProcessedId: number; take: number; lastUpdatedLte: Date }) => Promise<LeaderboardCharacter[]>;
  updateCharacter: (args: { id: number; data: UpdateCharacterData }) => Promise<void>;
  fetchImpl: typeof fetch;
  now: () => Date;
};

function calculateUpdateTimes(
  now: Date,
  updateHourUTC: number,
  gracePeriodHours: number
) {
  const mondayAtUpdateHour = new Date(now);
  mondayAtUpdateHour.setUTCHours(updateHourUTC, 0, 0, 0);
  mondayAtUpdateHour.setUTCDate(
    mondayAtUpdateHour.getUTCDate() - ((mondayAtUpdateHour.getUTCDay() + 6) % 7)
  );

  const lastMonday = new Date(mondayAtUpdateHour.getTime());
  if (now.getTime() < mondayAtUpdateHour.getTime()) {
    lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
  }

  const gracePeriodEndTime = new Date(
    lastMonday.getTime() + gracePeriodHours * 60 * 60 * 1000
  );
  return { gracePeriodEndTime };
}

export function createBatchedLeaderboardUpdateRouteHandlers(
  deps: BatchedLeaderboardUpdateDeps
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

    try {
      const batchSize = 100;
      let checkedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      const gracePeriodHours = 0.5;
      const updateHourUTC = 5;

      const { gracePeriodEndTime } = calculateUpdateTimes(
        deps.now(),
        updateHourUTC,
        gracePeriodHours
      );

      const lastProcessedId = await deps.getLastProcessedCharacterId();
      const characters = await deps.findCharacters({
        lastProcessedId,
        take: batchSize,
        lastUpdatedLte: gracePeriodEndTime,
      });

      for (const character of characters) {
        checkedCount++;
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
            if (character.lastUpdated) {
              const characterLastUpdated = new Date(character.lastUpdated);
              const realmPointsDiff =
                currentStats.realm_points - character.totalRealmPoints;
              const soloKillsDiff =
                currentStats.player_kills.total.solo_kills - character.totalSoloKills;
              const deathsDiff =
                currentStats.player_kills.total.deaths - character.totalDeaths;
              const deathBlowsDiff =
                currentStats.player_kills.total.death_blows - character.totalDeathBlows;

              const updateData: UpdateCharacterData = {
                lastUpdated: deps.now(),
              };

              if (character.totalRealmPoints !== currentStats.realm_points) {
                updateData.totalRealmPoints = currentStats.realm_points;
              }
              if (
                character.totalSoloKills !== currentStats.player_kills.total.solo_kills
              ) {
                updateData.totalSoloKills = currentStats.player_kills.total.solo_kills;
              }
              if (character.totalDeaths !== currentStats.player_kills.total.deaths) {
                updateData.totalDeaths = currentStats.player_kills.total.deaths;
              }
              if (
                character.totalDeathBlows !==
                currentStats.player_kills.total.death_blows
              ) {
                updateData.totalDeathBlows =
                  currentStats.player_kills.total.death_blows;
              }

              let weeklyRealmPoints = 0;
              let weeklySoloKills = 0;
              let weeklyDeaths = 0;
              let weeklyDeathBlows = 0;

              if (characterLastUpdated <= gracePeriodEndTime) {
                weeklyRealmPoints = realmPointsDiff > 0 ? realmPointsDiff : 0;
                weeklySoloKills = soloKillsDiff > 0 ? soloKillsDiff : 0;
                weeklyDeaths = deathsDiff > 0 ? deathsDiff : 0;
                weeklyDeathBlows = deathBlowsDiff > 0 ? deathBlowsDiff : 0;
              }

              if (character.realmPointsLastWeek !== weeklyRealmPoints) {
                updateData.realmPointsLastWeek = weeklyRealmPoints;
              }
              if (character.soloKillsLastWeek !== weeklySoloKills) {
                updateData.soloKillsLastWeek = weeklySoloKills;
              }
              if (character.deathsLastWeek !== weeklyDeaths) {
                updateData.deathsLastWeek = weeklyDeaths;
              }
              if (character.deathBlowsLastWeek !== weeklyDeathBlows) {
                updateData.deathBlowsLastWeek = weeklyDeathBlows;
              }

              if (Object.keys(updateData).length > 1) {
                await deps.updateCharacter({ id: character.id, data: updateData });
                updatedCount++;
              } else {
                await deps.updateCharacter({
                  id: character.id,
                  data: { lastUpdated: deps.now() },
                });
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to update stats for character ${character.webId}:`,
            error
          );
          failedCount++;
        }
      }

      if (characters.length > 0) {
        const newLastProcessedId = characters[characters.length - 1].id;
        await deps.updateLastProcessedCharacterId(newLastProcessedId);
      }

      return NextResponse.json({
        message: "Batch update process completed",
        checkedCharacters: checkedCount,
        updatedCharacters: updatedCount,
        failedUpdates: failedCount,
      });
    } catch (error) {
      console.error("Error running batched leaderboard update:", error);
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
