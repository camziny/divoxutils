import React from "react";
import { TableCell } from "@mui/material";
import RealmRank, {
  getRealmRankForPoints,
  getRealmRanks,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
} from "./RealmRank";
import LinearProgress from "@mui/material/LinearProgress";
import { Progress, CircularProgress } from "@nextui-org/react";
import TotalStatsCard from "./TotalStatsCard";
import InfoStatsCard from "./InfoStatsCard";
import RealmStatsCard from "./RealmStatsCard";
import CharacterInfoCard from "./CharacterInfoCard";

type KillStats = {
  kills: number;
  deaths: number;
  death_blows: number;
  solo_kills: number;
};

export type CharacterInfo = {
  character_web_id: string;
  name: string;
  realm: number;
  race: string;
  class_name: string;
  level: number;
  nextRankPoints?: number;
  guild_info?: {
    guild_name?: string;
  };
  realm_war_stats: {
    current: {
      realm_points: number;
      player_kills: {
        total: KillStats;
        [key: string]: KillStats;
      };
    };
  };
};

type CharacterDetailsProps = {
  character: CharacterInfo;
  opponentRealms: string[];
};

type RealmColorsType = {
  [key: string]: string;
  albion: string;
  midgard: string;
  hibernia: string;
  total: string;
};

const realmColors: RealmColorsType = {
  albion: "bg-red-500",
  midgard: "bg-blue-500",
  hibernia: "bg-green-500",
  total: "bg-gray-600",
};

const CharacterDetails: React.FC<CharacterDetailsProps> = ({
  character,
  opponentRealms,
}) => {
  const firstOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[0]];
  const secondOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[1]];

  const realmColors = {
    albion: "albion",
    midgard: "midgard",
    hibernia: "hibernia",
    total: "bg-gray-600",
  };

  const realmPoints = character.realm_war_stats?.current?.realm_points;
  const deaths =
    character.realm_war_stats?.current?.player_kills?.total?.deaths;
  const irs =
    !deaths || deaths === 0
      ? undefined
      : realmPoints && deaths
      ? parseFloat((realmPoints / deaths).toFixed(2))
      : undefined;
  const currentRank = getRealmRankForPoints(realmPoints);
  const nextRankPoints = getRealmRanks().get(currentRank + 1) || 0;
  const pointsUntilNextRank = nextRankPoints - realmPoints;
  const totalKills =
    character.realm_war_stats?.current?.player_kills?.total?.kills || 0;
  const currentRankNumber = getRealmRankForPoints(
    character.realm_war_stats?.current?.realm_points
  );
  const nextRankFormatted = formatRealmRankWithLevel(currentRankNumber + 1);
  const currentRankFormatted = formatRealmRankWithLevel(currentRank);
  const capitalizeRealm = (realm: string) => {
    return realm.charAt(0).toUpperCase() + realm.slice(1);
  };
  const totalDeathblows =
    character.realm_war_stats?.current?.player_kills?.total?.death_blows;
  const totalSoloKills =
    character.realm_war_stats?.current?.player_kills?.total?.solo_kills;

  const dbPerKillPercentage: number =
    totalKills === 0
      ? 0
      : parseFloat(((totalDeathblows / totalKills) * 100).toFixed(2));

  const skPerKillPercentage: number =
    totalKills === 0
      ? 0
      : parseFloat(((totalSoloKills / totalKills) * 100).toFixed(2));

  function formatNumber(num: any) {
    if (typeof num === "number" && !isNaN(num)) {
      return num.toLocaleString();
    } else if (num === undefined || num === null) {
      return "0";
    } else {
      return "N/A";
    }
  }

  const progressPercentage = calculateProgressPercentage(
    realmPoints,
    nextRankPoints
  );

  return (
    <TableCell className="bg-gray-900 w-full p-3" colSpan={9}>
      <div className="flex justify-center items-center h-full">
        <div className="sm:hidden w-full">
          <div className="bg-gray-900 rounded-lg mx-0 p-2">
            <CharacterInfoCard character={character} />
            <div className="mb-2 w-full">
              <InfoStatsCard
                totalRP={formatNumber(realmPoints)}
                irs={formatNumber(
                  irs !== undefined ? Math.round(irs) : undefined
                )}
                rpsToNextRank={formatNumber(pointsUntilNextRank)}
                currentRank={currentRankFormatted}
                nextRank={nextRankFormatted}
                progressPercentage={progressPercentage}
              />
            </div>
            <div className="mb-2 w-full">
              <TotalStatsCard
                kills={formatNumber(
                  character.realm_war_stats?.current?.player_kills?.total
                    ?.kills || 0
                )}
                deathBlows={formatNumber(
                  character.realm_war_stats?.current?.player_kills?.total
                    ?.death_blows || 0
                )}
                soloKills={formatNumber(
                  character.realm_war_stats?.current?.player_kills?.total
                    ?.solo_kills || 0
                )}
                deaths={formatNumber(
                  character.realm_war_stats?.current?.player_kills?.total
                    ?.deaths || 0
                )}
                dbPerKillPercentage={dbPerKillPercentage}
                skPerKillPercentage={skPerKillPercentage}
              />
            </div>
            <div className="mb-2 w-full">
              {opponentRealms.map((realm) => {
                const realmStats =
                  character.realm_war_stats?.current?.player_kills[realm];
                const dbPerKillRatio =
                  realmStats?.kills === 0
                    ? 0
                    : (realmStats.death_blows / realmStats.kills) * 100;
                const skPerKillRatio =
                  realmStats?.kills === 0
                    ? 0
                    : (realmStats.solo_kills / realmStats.kills) * 100;
                return (
                  <RealmStatsCard
                    key={realm}
                    realm={realm}
                    kills={formatNumber(realmStats?.kills || 0)}
                    deathBlows={formatNumber(realmStats?.death_blows || 0)}
                    soloKills={formatNumber(realmStats?.solo_kills || 0)}
                    dbPerKillRatio={dbPerKillRatio}
                    skPerKillRatio={skPerKillRatio}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="hidden sm:grid sm:grid-cols-4 sm:gap-4 sm:w-full sm:max-w-4xl sm:mx-auto">
          {[...opponentRealms, "Total", "Info"].map((realm, index) => {
            if (realm !== "Total" && realm !== "Info") {
              const realmStats =
                character.realm_war_stats?.current?.player_kills[realm];
              const kills = realmStats?.kills || 0;
              const deathBlows = realmStats?.death_blows || 0;
              const dbPerKillRatio =
                kills === 0 ? 0 : (deathBlows / kills) * 100;
              const skPerKillRatio =
                realmStats?.kills === 0
                  ? 0
                  : (realmStats.solo_kills / realmStats.kills) * 100;

              return (
                <RealmStatsCard
                  key={index}
                  realm={realm}
                  kills={formatNumber(realmStats?.kills || 0)}
                  deathBlows={formatNumber(realmStats?.death_blows || 0)}
                  soloKills={formatNumber(realmStats?.solo_kills || 0)}
                  dbPerKillRatio={dbPerKillRatio}
                  skPerKillRatio={skPerKillRatio}
                />
              );
            } else if (realm === "Total") {
              return (
                <TotalStatsCard
                  key={index}
                  kills={formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.kills || 0
                  )}
                  deathBlows={formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.death_blows || 0
                  )}
                  soloKills={formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.solo_kills || 0
                  )}
                  deaths={formatNumber(
                    character.realm_war_stats?.current?.player_kills?.total
                      ?.deaths || 0
                  )}
                  dbPerKillPercentage={dbPerKillPercentage}
                  skPerKillPercentage={skPerKillPercentage}
                />
              );
            } else {
              return (
                <InfoStatsCard
                  key={index}
                  totalRP={formatNumber(realmPoints)}
                  irs={formatNumber(
                    irs !== undefined ? Math.round(irs) : undefined
                  )}
                  rpsToNextRank={formatNumber(pointsUntilNextRank)}
                  currentRank={currentRankFormatted}
                  nextRank={nextRankFormatted}
                  progressPercentage={progressPercentage}
                />
              );
            }
          })}
        </div>
      </div>
    </TableCell>
  );
};

export default CharacterDetails;
