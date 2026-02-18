import React from "react";

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
  heraldTotalKills?: number;
  heraldTotalDeathBlows?: number;
  heraldTotalSoloKills?: number;
  player_kills?: {
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
    
    // Safe access to player_kills with fallback values
    const playerKills = character.player_kills?.total || {
      kills: character.heraldTotalKills || 0,
      death_blows: character.heraldTotalDeathBlows || 0,
      solo_kills: character.heraldTotalSoloKills || 0
    };

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
    Albion: "bg-red-900/20",
    Midgard: "bg-blue-900/20",
    Hibernia: "bg-green-900/20",
    Total: "bg-gray-800",
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
    <div className="bg-gray-900 p-2 sm:p-4 w-full">
      <div className="text-center mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-medium text-gray-300">
          Aggregate Statistics
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full">
        {realms.map((realm) => (
          <div
            key={realm}
            className="bg-gray-900 border border-gray-800 rounded-md text-white min-w-0"
          >
            <div className={`${realmColors[realm]} py-1 px-3 sm:px-4 rounded-t-md`}>
              <span className="text-xs font-medium">{realm}</span>
            </div>
            <div className="divide-y divide-gray-800 px-3 sm:px-4 py-1">
              {["Kills", "Death\u00A0Blows", "Solo Kills"].map((stat, i) => {
                const statKey = statsKeys[stat.replace('\u00A0', ' ') as keyof typeof statsKeys];
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1.5 whitespace-nowrap"
                  >
                    <span className="text-xs text-gray-400">{stat}</span>
                    <span className="text-xs font-semibold text-white ml-2 sm:ml-4 tabular-nums">
                      {formatNumber(aggregateStats[realm][statKey])}
                    </span>
                  </div>
                );
              })}
              <div className="py-1.5">
                <div className="flex justify-between items-center whitespace-nowrap">
                  <span className="text-xs text-gray-400">
                    <span className="xl:hidden">RPs</span>
                    <span className="hidden xl:inline">Realm Points</span>
                  </span>
                  <span className="text-xs font-semibold text-white ml-2 sm:ml-4 tabular-nums">
                    {formatNumber(aggregateStats[realm].realmPoints)}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1 pl-2 sm:pl-3 border-l border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">Last Week</span>
                    <span className="text-[11px] font-semibold text-gray-300 ml-2 sm:ml-4 tabular-nums">
                      {formatNumber(aggregateStats[realm].realmPointsLastWeek)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">This Week</span>
                    <span className="text-[11px] font-semibold text-gray-300 ml-2 sm:ml-4 tabular-nums">
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
  );
};

export default AggregateStatistics;
