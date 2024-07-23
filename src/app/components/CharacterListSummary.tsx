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
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
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
  realmPointsLastWeek: number;
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
  realmPointsLastWeek: 0,
  realmPointsThisWeek: 0,
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
  const aggregateStats: AggregateStats = initialAggregateStats();

  characters.forEach((character) => {
    const realm = character.realm;
    const playerKills = character.player_kills.total;

    const realmPoints = character.heraldRealmPoints || 0;
    const realmPointsLastWeek = character.realmPointsLastWeek || 0;
    const realmPointsThisWeek =
      character.heraldRealmPoints - character.totalRealmPoints;

    if (aggregateStats[realm]) {
      aggregateStats[realm].kills += playerKills.kills;
      aggregateStats[realm].death_blows += playerKills.death_blows;
      aggregateStats[realm].solo_kills += playerKills.solo_kills;
      aggregateStats[realm].realmPoints += realmPoints;
      aggregateStats[realm].realmPointsLastWeek += realmPointsLastWeek;
      aggregateStats[realm].realmPointsThisWeek += realmPointsThisWeek;
    }

    aggregateStats.Total.kills += playerKills.kills;
    aggregateStats.Total.death_blows += playerKills.death_blows;
    aggregateStats.Total.solo_kills += playerKills.solo_kills;
    aggregateStats.Total.realmPoints += realmPoints;
    aggregateStats.Total.realmPointsLastWeek += realmPointsLastWeek;
    aggregateStats.Total.realmPointsThisWeek += realmPointsThisWeek;
  });

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

  const statsKeys: Record<string, keyof RealmStats> = {
    Kills: "kills",
    "Death Blows": "death_blows",
    "Solo Kills": "solo_kills",
    "Realm Points": "realmPoints",
    "Realm Points Last Week": "realmPointsLastWeek",
    "Realm Points This Week": "realmPointsThisWeek",
  };

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
                {["Kills", "Death Blows", "Solo Kills"].map((stat, i) => {
                  const statKey = statsKeys[stat as keyof typeof statsKeys];
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs sm:text-sm"
                    >
                      <span className="font-medium">{stat}:</span>
                      <span className="w-20 sm:w-24 text-right font-medium">
                        {formatNumber(aggregateStats[realm][statKey])}
                      </span>
                    </div>
                  );
                })}
                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <h3 className="text-sm font-medium">Realm Points:</h3>
                    <span className="w-20 sm:w-24 text-right font-medium">
                      {formatNumber(aggregateStats[realm].realmPoints)}
                    </span>
                  </div>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">Last Week:</span>
                      <span className="w-20 sm:w-24 text-right font-medium">
                        {formatNumber(
                          aggregateStats[realm].realmPointsLastWeek
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">This Week:</span>
                      <span className="w-20 sm:w-24 text-right font-medium">
                        {formatNumber(
                          aggregateStats[realm].realmPointsThisWeek
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TableCell>
  );
};

export default AggregateStatistics;
