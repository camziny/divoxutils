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
    Albion: "bg-gradient-to-r from-red-800/20 to-red-700/20",
    Midgard: "bg-gradient-to-r from-blue-800/20 to-blue-700/20",
    Hibernia: "bg-gradient-to-r from-green-800/20 to-green-700/20",
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
    <TableCell className="bg-gray-900/90 backdrop-blur-sm p-2 sm:p-4" colSpan={9}>
      <div className="text-center mb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-200 bg-clip-text">
          Aggregate Statistics
        </h2>
      </div>
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
          {realms.map((realm) => (
            <div
              key={realm}
              className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-white p-2"
            >
              <span
                className={`inline-block py-0.5 px-2 rounded-md ${realmColors[realm]} uppercase text-sm font-semibold tracking-wide w-full text-center`}
              >
                {realm}
              </span>
              <div className="space-y-1 mt-1.5">
                {["Kills", "Death\u00A0Blows", "Solo Kills"].map((stat, i) => {
                  const statKey = statsKeys[stat.replace('\u00A0', ' ') as keyof typeof statsKeys];
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm bg-gray-700/30 rounded px-2 py-0.5 whitespace-nowrap"
                    >
                      <span className="text-gray-300">{stat}:</span>
                      <span className="font-medium text-gray-100 ml-4 w-28 text-right">
                        {formatNumber(aggregateStats[realm][statKey])}
                      </span>
                    </div>
                  );
                })}
                <div className="bg-gray-700/30 rounded p-1.5">
                  <div className="flex justify-between items-center text-sm whitespace-nowrap">
                    <span className="text-gray-300">Realm Points:</span>
                    <span className="font-medium text-gray-100 ml-4 w-28 text-right">
                      {formatNumber(aggregateStats[realm].realmPoints)}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1 pl-2 border-l border-gray-600/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Last Week:</span>
                      <span className="font-medium text-gray-200 ml-4 w-28 text-right">
                        {formatNumber(aggregateStats[realm].realmPointsLastWeek)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">This Week:</span>
                      <span className="font-medium text-gray-200 ml-4 w-28 text-right">
                        {formatNumber(aggregateStats[realm].realmPointsThisWeek)}
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
