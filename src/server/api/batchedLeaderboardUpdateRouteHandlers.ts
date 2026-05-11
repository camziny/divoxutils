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
  totalKills?: number;
  totalSoloKills: number;
  totalDeaths: number;
  totalDeathBlows: number;
  realmPointsLastWeek: number;
  killsLastWeek?: number;
  soloKillsLastWeek: number;
  deathsLastWeek: number;
  deathBlowsLastWeek: number;
  lastUpdated: Date | null;
};

type UpdateCharacterData = {
  totalRealmPoints?: number;
  realmPointsLastWeek?: number;
  totalKills?: number;
  killsLastWeek?: number;
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
  getLastProcessedCharacterId: (key?: string) => Promise<number>;
  updateLastProcessedCharacterId: (lastId: number, key?: string) => Promise<void>;
  findCharacters: (args: { lastProcessedId: number; take: number; lastUpdatedLte: Date }) => Promise<LeaderboardCharacter[]>;
  updateCharacter: (args: { id: number; data: UpdateCharacterData }) => Promise<void>;
  fetchImpl: typeof fetch;
  now: () => Date;
};

const weeklyLeaderboardTimeZone = "America/New_York";

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    weekday: weekdayMap[getPart("weekday")] ?? 0,
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
    second: Number(getPart("second")),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

function getUtcForTimeZoneDate(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  timeZone: string
) {
  const utcGuess = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
  );
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const utcDate = new Date(utcGuess.getTime() - offset);
  const adjustedOffset = getTimeZoneOffsetMs(utcDate, timeZone);
  return adjustedOffset === offset
    ? utcDate
    : new Date(utcGuess.getTime() - adjustedOffset);
}

function calculateUpdateTimes(now: Date, gracePeriodHours: number) {
  const nowParts = getTimeZoneParts(now, weeklyLeaderboardTimeZone);
  const daysSinceMonday = (nowParts.weekday + 6) % 7;
  const mondayDate = new Date(
    Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day - daysSinceMonday)
  );
  const mondayStart = getUtcForTimeZoneDate(
    {
      year: mondayDate.getUTCFullYear(),
      month: mondayDate.getUTCMonth() + 1,
      day: mondayDate.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    weeklyLeaderboardTimeZone
  );

  const gracePeriodEndTime = new Date(
    mondayStart.getTime() + gracePeriodHours * 60 * 60 * 1000
  );
  return { gracePeriodEndTime };
}

function getWeeklyLeaderboardCursorKey(gracePeriodEndTime: Date) {
  const weekKey = gracePeriodEndTime.toISOString().slice(0, 10);
  return `lastProcessedCharacterId:weekly:${weekKey}`;
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

      const { gracePeriodEndTime } = calculateUpdateTimes(
        deps.now(),
        gracePeriodHours
      );
      const cursorKey = getWeeklyLeaderboardCursorKey(gracePeriodEndTime);

      const lastProcessedId = await deps.getLastProcessedCharacterId(cursorKey);
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
                    kills: number;
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
              const currentTotalKills = currentStats.player_kills.total.kills;
              const storedTotalKills = character.totalKills ?? 0;
              const hasMissingKillBaseline =
                storedTotalKills === 0 && currentTotalKills > 0;
              const realmPointsDiff =
                currentStats.realm_points - character.totalRealmPoints;
              const killsDiff = hasMissingKillBaseline
                ? 0
                : currentTotalKills - storedTotalKills;
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
              if (storedTotalKills !== currentTotalKills) {
                updateData.totalKills = currentTotalKills;
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
              let weeklyKills = 0;
              let weeklySoloKills = 0;
              let weeklyDeaths = 0;
              let weeklyDeathBlows = 0;

              if (characterLastUpdated <= gracePeriodEndTime) {
                weeklyRealmPoints = realmPointsDiff > 0 ? realmPointsDiff : 0;
                weeklyKills = killsDiff > 0 ? killsDiff : 0;
                weeklySoloKills = soloKillsDiff > 0 ? soloKillsDiff : 0;
                weeklyDeaths = deathsDiff > 0 ? deathsDiff : 0;
                weeklyDeathBlows = deathBlowsDiff > 0 ? deathBlowsDiff : 0;
              }

              if (character.realmPointsLastWeek !== weeklyRealmPoints) {
                updateData.realmPointsLastWeek = weeklyRealmPoints;
              }
              if (
                (character.killsLastWeek ?? 0) !== weeklyKills ||
                hasMissingKillBaseline
              ) {
                updateData.killsLastWeek = weeklyKills;
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
        await deps.updateLastProcessedCharacterId(newLastProcessedId, cursorKey);
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
