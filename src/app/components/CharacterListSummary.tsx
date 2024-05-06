import React from "react";
import { TableCell } from "@mui/material";

interface PlayerKillStats {
  kills: number;
  death_blows: number;
  solo_kills: number;
}

interface RealmStats {
  kills: number;
  death_blows: number;
  solo_kills: number;
  realmPoints: number;
}

interface AggregateStats {
  Albion: RealmStats;
  Hibernia: RealmStats;
  Midgard: RealmStats;
  Total: RealmStats;
  [key: string]: RealmStats;
}

interface CharacterData {
  realm: string;
  totalRealmPoints: number;
  heraldRealmPoints: number;
  heraldName: string;
  player_kills: {
    total: PlayerKillStats;
    midgard?: PlayerKillStats;
    albion?: PlayerKillStats;
    hibernia?: PlayerKillStats;
  };
}

const initialRealmStats = (): RealmStats => ({
  kills: 0,
  death_blows: 0,
  solo_kills: 0,
  realmPoints: 0,
});

const initialAggregateStats = (): AggregateStats => ({
  Albion: initialRealmStats(),
  Hibernia: initialRealmStats(),
  Midgard: initialRealmStats(),
  Total: initialRealmStats(),
});

const AggregateStatistics: React.FC<{ characters: CharacterData[] }> = ({
  characters,
}) => {
  const aggregateStats: AggregateStats = {
    Albion: initialRealmStats(),
    Hibernia: initialRealmStats(),
    Midgard: initialRealmStats(),
    Total: initialRealmStats(),
  };

  characters.forEach((character) => {
    const realm = character.realm;
    const playerKills = character.player_kills.total;

    const realmPoints = character.heraldRealmPoints || 0;

    if (aggregateStats[realm]) {
      aggregateStats[realm].kills += playerKills.kills;
      aggregateStats[realm].death_blows += playerKills.death_blows;
      aggregateStats[realm].solo_kills += playerKills.solo_kills;
      aggregateStats[realm].realmPoints += realmPoints;
    }

    aggregateStats.Total.kills += playerKills.kills;
    aggregateStats.Total.death_blows += playerKills.death_blows;
    aggregateStats.Total.solo_kills += playerKills.solo_kills;
    aggregateStats.Total.realmPoints += realmPoints;
  });

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

  // characters.forEach((character) => {
  //   if (
  //     character &&
  //     character.detailedCharacter &&
  //     character.detailedCharacter.realm_war_stats &&
  //     character.detailedCharacter.realm_war_stats.current
  //   ) {
  //     const currentStats = character.detailedCharacter.realm_war_stats.current;
  //     const realmPointsLastWeek = character.character?.realmPointsLastWeek || 0;
  //     aggregateStats.totalRPsLastWeek += realmPointsLastWeek;

  //     aggregateStats.totalRPs += currentStats.realm_points;

  //     let realmKey = "";

  //     if (character.detailedCharacter.realm === 1) {
  //       realmKey = "albion";
  //       aggregateStats.albionTotalRPs += currentStats.realm_points;
  //       aggregateStats.albionRPsLastWeek += realmPointsLastWeek;
  //     } else if (character.detailedCharacter.realm === 2) {
  //       realmKey = "midgard";
  //       aggregateStats.midgardTotalRPs += currentStats.realm_points;
  //       aggregateStats.midgardRPsLastWeek += realmPointsLastWeek;
  //     } else if (character.detailedCharacter.realm === 3) {
  //       realmKey = "hibernia";
  //       aggregateStats.hiberniaTotalRPs += currentStats.realm_points;
  //       aggregateStats.hiberniaRPsLastWeek += realmPointsLastWeek;
  //     }

  //     if (realmKey) {
  //       aggregateStats.player_kills[realmKey].kills +=
  //         currentStats.player_kills.total.kills;
  //       aggregateStats.player_kills[realmKey].solo_kills +=
  //         currentStats.player_kills.total.solo_kills;
  //       aggregateStats.player_kills[realmKey].death_blows +=
  //         currentStats.player_kills.total.death_blows;
  //     }

  //     aggregateStats.player_kills.total.kills +=
  //       currentStats.player_kills.total.kills;
  //     aggregateStats.player_kills.total.solo_kills +=
  //       currentStats.player_kills.total.solo_kills;
  //     aggregateStats.player_kills.total.death_blows +=
  //       currentStats.player_kills.total.death_blows;
  //   }
  // });

  const formatNumber = (num: number | undefined) => {
    return typeof num === "number" && !isNaN(num)
      ? num.toLocaleString()
      : "N/A";
  };

  const realmColors: Record<string, string> = {
    Albion: "albion",
    Midgard: "midgard",
    Hibernia: "hibernia",
    Total: "bg-gray-600",
  };

  const capitalizeRealm = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const realms = ["Albion", "Midgard", "Hibernia", "Total"];

  return (
    <TableCell className="bg-gray-900 p-3 sm:p-5" colSpan={9}>
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Aggregate Statistics
        </h2>
      </div>
      <div className="flex justify-center items-center h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full max-w-4xl mx-auto">
          {realms.map((realm, index) => (
            <div
              key={index}
              className={`bg-gray-800 p-2 sm:p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-white space-y-2`}
            >
              <span
                className={`inline-block py-0.5 px-2 rounded-full ${realmColors[realm]} uppercase text-xs font-medium`}
              >
                {realm}
              </span>
              <div className="space-y-1.5 mt-1">
                {["Kills", "Death Blows", "Solo Kills", "Realm Points"].map(
                  (stat, i) => {
                    let statKey = stat.replace(/ /g, "_").toLowerCase();
                    if (stat === "Realm Points") {
                      statKey = "realmPoints";
                    }
                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs sm:text-sm"
                      >
                        <span className="font-medium">{stat}:</span>
                        <span className="w-20 sm:w-24 text-right font-medium">
                          {formatNumber(
                            (aggregateStats as any)[realm][statKey]
                          )}
                        </span>
                      </div>
                    );
                  }
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
