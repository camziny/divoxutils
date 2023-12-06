import React from "react";
import { TableCell } from "@mui/material";

type PlayerKillStats = {
  kills: number;
  death_blows: number;
  solo_kills: number;
};

type AggregateStatisticsProps = {
  characters: DetailedCharacter[];
  opponentRealms: string[];
};

type PlayerKillsAggregate = {
  [key: string]: PlayerKillStats;
} & {
  total: PlayerKillStats;
};

type AggregateStatsType = {
  totalRPs: number;
  midgardTotalRPs: number;
  hiberniaTotalRPs: number;
  albionTotalRPs: number;
  player_kills: PlayerKillsAggregate;
};

type Character = {
  id: number;
  webId: string;
};

type RealmColors = {
  albion: string;
  midgard: string;
  hibernia: string;
  total: string;
  [key: string]: string;
};

type DetailedCharacter = {
  clerkUserId?: string;
  characterId?: number;
  user?: {
    id: number;
    clerkUserId?: string;
    email?: string;
    name?: string;
    accountId?: number | null;
  };
  character?: {
    id: number;
    webId: string;
  };
  detailedCharacter: {
    character_web_id: string;
    name: string;
    server_name: string;
    realm: number;
    realm_war_stats: {
      current: {
        realm_points: number;
        player_kills: {
          total: {
            kills: number;
            deaths: number;
            death_blows: number;
            solo_kills: number;
          };
          midgard?: {
            kills: number;
            deaths: number;
            death_blows: number;
            solo_kills: number;
          };
          hibernia?: {
            kills: number;
            deaths: number;
            death_blows: number;
            solo_kills: number;
          };
          albion?: {
            kills: number;
            deaths: number;
            death_blows: number;
            solo_kills: number;
          };
        };
      };
    };
  };
};

const realmToPropertyMap: Record<string, keyof AggregateStatsType> = {
  albion: "albionTotalRPs",
  midgard: "midgardTotalRPs",
  hibernia: "hiberniaTotalRPs",
  total: "totalRPs",
};

const AggregateStatistics: React.FC<AggregateStatisticsProps> = ({
  characters,
}) => {
  let aggregateStats: AggregateStatsType = {
    totalRPs: 0,
    midgardTotalRPs: 0,
    hiberniaTotalRPs: 0,
    albionTotalRPs: 0,
    player_kills: {
      total: { kills: 0, death_blows: 0, solo_kills: 0 },
      midgard: { kills: 0, death_blows: 0, solo_kills: 0 },
      hibernia: { kills: 0, death_blows: 0, solo_kills: 0 },
      albion: { kills: 0, death_blows: 0, solo_kills: 0 },
    },
  };

  const getOpponentRealms = (realm: number) => {
    switch (realm) {
      case 1:
        return ["2", "3"];
      case 2:
        return ["1", "3"];
      case 3:
        return ["1", "2"];
      default:
        return ["1", "2", "3"];
    }
  };

  characters.forEach((character) => {
    const currentStats = character.detailedCharacter.realm_war_stats.current;
    if (currentStats) {
      aggregateStats.totalRPs += currentStats.realm_points;

      const realmKey =
        character.detailedCharacter.realm === 1
          ? "albion"
          : character.detailedCharacter.realm === 2
          ? "midgard"
          : "hibernia";

      if (character.detailedCharacter.realm === 1) {
        aggregateStats.albionTotalRPs += currentStats.realm_points;
      } else if (character.detailedCharacter.realm === 2) {
        aggregateStats.midgardTotalRPs += currentStats.realm_points;
      } else if (character.detailedCharacter.realm === 3) {
        aggregateStats.hiberniaTotalRPs += currentStats.realm_points;
      }

      aggregateStats.player_kills[realmKey].kills +=
        currentStats.player_kills.total.kills;
      aggregateStats.player_kills[realmKey].solo_kills +=
        currentStats.player_kills.total.solo_kills;
      aggregateStats.player_kills[realmKey].death_blows +=
        currentStats.player_kills.total.death_blows;

      aggregateStats.player_kills.total.kills +=
        currentStats.player_kills.total.kills;
      aggregateStats.player_kills.total.solo_kills +=
        currentStats.player_kills.total.solo_kills;
      aggregateStats.player_kills.total.death_blows +=
        currentStats.player_kills.total.death_blows;
    }
  });

  const formatNumber = (num: any) => {
    return typeof num === "number" && !isNaN(num)
      ? num.toLocaleString()
      : "N/A";
  };

  const realmColors: RealmColors = {
    albion: "albion",
    midgard: "midgard",
    hibernia: "hibernia",
    total: "bg-gray-600",
  };

  const capitalizeRealm = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const opponentRealms = ["Midgard", "Hibernia", "Albion"];

  return (
    <TableCell className="bg-gray-900 p-3 sm:p-5" colSpan={9}>
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Aggregate Statistics
        </h2>
      </div>
      <div className="flex justify-center items-center h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full max-w-4xl mx-auto">
          {[...opponentRealms, "Total"].map((realm, index) => (
            <div
              key={index}
              className="bg-gray-800 p-2 sm:p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-white space-y-2"
            >
              <span
                className={`inline-block py-0.5 px-2 rounded-full ${
                  realm !== "Total"
                    ? realmColors[realm.toLowerCase()]
                    : realmColors.total
                } uppercase text-xs font-medium`}
              >
                {realm}
              </span>

              <div className="space-y-1.5 mt-1">
                {["Kills", "Death Blows", "Solo Kills", "Realm Points"].map(
                  (stat, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs sm:text-sm"
                    >
                      <span className="font-medium">{stat}:</span>
                      <span className="w-20 sm:w-24 text-right font-medium">
                        {stat !== "Realm Points"
                          ? formatNumber(
                              aggregateStats.player_kills[
                                realm.toLowerCase() as keyof PlayerKillsAggregate
                              ]?.[
                                stat
                                  .replace(/ /g, "_")
                                  .toLowerCase() as keyof PlayerKillStats
                              ]
                            )
                          : realm !== "Total"
                          ? formatNumber(
                              aggregateStats[
                                realmToPropertyMap[realm.toLowerCase()]
                              ]
                            )
                          : formatNumber(aggregateStats.totalRPs)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TableCell>
  );
};

export default AggregateStatistics;
