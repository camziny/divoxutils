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
import {
  CharacterData,
  Realm,
  PlayerKillRealm,
  PlayerKills,
  RealmType,
} from "@/utils/character";

type KillStats = {
  kills: number;
  deaths: number;
  death_blows: number;
  solo_kills: number;
};

type CharacterInfo = {
  character_web_id: string;
  name: string;
  realm: number;
  race: string;
  class_name: string;
  level: number;
  guild_info?: {
    guild_name?: string;
  };
  realm_points: number;
  formattedRealmPoints: string;
  guild_name: string;
  player_kills: {
    total: KillStats;
    [key: string]: KillStats;
  };
};

type CharacterDetailsProps = {
  character: CharacterData;
  opponentRealms: string[];
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalRealmPoints: number;
};

type RealmColorsType = {
  [key: string]: string;
  albion: string;
  midgard: string;
  hibernia: string;
  total: string;
};

function isValidRealmKey(key: any): key is RealmType {
  return ["total", "midgard", "albion", "hibernia"].includes(key);
}

const realmColors = {
  albion: "bg-gradient-to-r from-red-800/20 to-red-700/20",
  midgard: "bg-gradient-to-r from-blue-800/20 to-blue-700/20",
  hibernia: "bg-gradient-to-r from-green-800/20 to-green-700/20",
  total: "bg-gray-600",
};

const CharacterDetails: React.FC<CharacterDetailsProps> = ({
  character,
  opponentRealms,
  realmPointsLastWeek,
  realmPointsThisWeek,
  totalRealmPoints,
}) => {
  const totalKills = character.player_kills.total
    ? character.player_kills.total.kills
    : 0;
  const midgardKills = character.player_kills.midgard
    ? character.player_kills.midgard.kills
    : 0;
  const albionKills = character.player_kills.albion
    ? character.player_kills.albion.kills
    : 0;
  const hiberniaKills = character.player_kills.hibernia
    ? character.player_kills.hibernia.kills
    : 0;

  const getStats = (realm: Realm, character: CharacterData) => {
    const realmMapping: Record<
      Realm,
      {
        kills: number | undefined;
        deaths: number | undefined;
        death_blows: number | undefined;
        solo_kills?: number | undefined;
      }
    > = {
      Midgard: {
        kills: character?.heraldMidgardKills,
        deaths: character?.heraldMidgardDeaths,
        death_blows: character?.heraldMidgardDeathBlows,
      },
      Albion: {
        kills: character?.heraldAlbionKills,
        deaths: character?.heraldAlbionDeaths,
        death_blows: character?.heraldAlbionDeathBlows,
        solo_kills: character?.heraldAlbionSoloKills,
      },
      Hibernia: {
        kills: character?.heraldHiberniaKills || 0,
        deaths: character?.heraldHiberniaDeaths || 0,
        death_blows: character?.heraldHiberniaDeathBlows || 0,
        solo_kills: character?.heraldHiberniaSoloKills || 0,
      },
    };

    return (
      realmMapping[realm] || {
        kills: 0,
        deaths: 0,
        death_blows: 0,
        solo_kills: 0,
      }
    );
  };

  const {
    player_kills: {
      total: { kills, deaths, death_blows, solo_kills },
      albion,
      midgard,
      hibernia,
    },
  } = character;

  const realmPoints = character.heraldRealmPoints;
  const irs =
    !deaths || deaths === 0
      ? undefined
      : realmPoints && deaths
      ? parseFloat((realmPoints / deaths).toFixed(2))
      : undefined;
  const currentRank = getRealmRankForPoints(realmPoints);
  const nextRankPoints = getRealmRanks().get(currentRank + 1) || 0;
  const pointsUntilNextRank = nextRankPoints - realmPoints;
  const currentRankNumber = getRealmRankForPoints(character.heraldRealmPoints);
  const nextRankFormatted = formatRealmRankWithLevel(currentRankNumber + 1);
  const currentRankFormatted = formatRealmRankWithLevel(currentRank);
  const capitalizeRealm = (realm: string) => {
    return realm.charAt(0).toUpperCase() + realm.slice(1);
  };
  const totalDeathblows = character.player_kills?.total?.death_blows;
  const totalSoloKills = character.player_kills?.total?.solo_kills;

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
    <TableCell className="bg-gray-900 w-full p-2" colSpan={9}>
      <div className="flex justify-center items-center h-full">
        <div className="sm:hidden w-full">
          <div className="bg-gray-900 rounded-lg mx-auto p-2 max-w-[260px]">
            <div className="space-y-2">
              <CharacterInfoCard character={character} />
              <InfoStatsCard
                totalRP={formatNumber(realmPoints)}
                irs={formatNumber(
                  irs !== undefined ? Math.round(irs) : undefined
                )}
                rpsToNextRank={formatNumber(pointsUntilNextRank)}
                currentRank={currentRankFormatted}
                nextRank={nextRankFormatted}
                progressPercentage={progressPercentage}
                realmPointsThisWeek={formatNumber(realmPointsThisWeek)}
                realmPointsLastWeek={formatNumber(
                  realmPointsLastWeek === totalRealmPoints
                    ? 0
                    : realmPointsLastWeek
                )}
              />
              <TotalStatsCard
                kills={formatNumber(totalKills)}
                deathBlows={formatNumber(
                  character.player_kills?.total?.death_blows || 0
                )}
                soloKills={formatNumber(
                  character.player_kills?.total?.solo_kills || 0
                )}
                deaths={formatNumber(
                  character.player_kills?.total?.deaths || 0
                )}
                dbPerKillPercentage={dbPerKillPercentage}
                skPerKillPercentage={skPerKillPercentage}
              />
              {opponentRealms.map((realm) => {
                const realmKey =
                  realm.toLowerCase() as keyof typeof character.player_kills;
                const realmStats = character.player_kills[realmKey];
                const dbPerKillRatio =
                  realmStats &&
                  realmStats.kills &&
                  realmStats.death_blows !== undefined
                    ? (realmStats.death_blows / realmStats.kills) * 100
                    : 0;
                const skPerKillRatio =
                  realmStats &&
                  realmStats.kills &&
                  realmStats.solo_kills !== undefined
                    ? (realmStats.solo_kills / realmStats.kills) * 100
                    : 0;

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
              const realmKey =
                realm.toLowerCase() as keyof typeof character.player_kills;
              const realmStats = character.player_kills[realmKey];
              const kills = realmStats?.kills || 0;
              const deathBlows = realmStats?.death_blows || 0;
              const dbPerKillRatio =
                kills === 0 ? 0 : (deathBlows / kills) * 100;
              const skPerKillRatio =
                realmStats &&
                realmStats.kills &&
                realmStats.solo_kills !== undefined
                  ? (realmStats.solo_kills / realmStats.kills) * 100
                  : 0;
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
                    character.player_kills?.total?.kills || 0
                  )}
                  deathBlows={formatNumber(
                    character.player_kills?.total?.death_blows || 0
                  )}
                  soloKills={formatNumber(
                    character.player_kills?.total?.solo_kills || 0
                  )}
                  deaths={formatNumber(
                    character.player_kills?.total?.deaths || 0
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
                  realmPointsThisWeek={formatNumber(realmPointsThisWeek)}
                  realmPointsLastWeek={formatNumber(
                    realmPointsLastWeek === totalRealmPoints
                      ? 0
                      : realmPointsLastWeek
                  )}
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
