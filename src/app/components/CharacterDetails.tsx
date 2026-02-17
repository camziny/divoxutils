import React from "react";
import { TableCell } from "@mui/material";
import {
  getRealmRankForPoints,
  getRealmRanks,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
} from "@/utils/character";
import TotalStatsCard from "./TotalStatsCard";
import InfoStatsCard from "./InfoStatsCard";
import RealmStatsCard from "./RealmStatsCard";
import CharacterInfoCard from "./CharacterInfoCard";
import {
  CharacterData,
  Realm,
} from "@/utils/character";
import { useEffect, useState } from "react";

type CharacterDetailsProps = {
  character: CharacterData;
  opponentRealms: string[];
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalRealmPoints: number;
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

  const {
    player_kills: {
      total: { deaths },
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
  const pointsUntilNextRank = Math.max(nextRankPoints - realmPoints, 0);
  const currentRankNumber = getRealmRankForPoints(character.heraldRealmPoints);
  const nextRankFormatted = formatRealmRankWithLevel(currentRankNumber + 1);
  const currentRankFormatted = formatRealmRankWithLevel(currentRank);
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

  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const duration = 1000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedProgress(progressPercentage * easeOut);
        setAnimatedPercentage(progressPercentage * easeOut);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [progressPercentage]);

  return (
    <TableCell className="bg-gray-900 w-full px-2 py-1" colSpan={9}>
      <div className="flex justify-center">
        <div className="sm:hidden w-full">
          <div className="bg-gray-900 rounded-lg mx-auto p-1 max-w-[260px]">
            <div className="space-y-1.5">
              <CharacterInfoCard character={character} />
              <InfoStatsCard
                totalRP={formatNumber(realmPoints)}
                irs={formatNumber(
                  irs !== undefined ? Math.round(irs) : undefined
                )}
                rpsToNextRank={formatNumber(pointsUntilNextRank)}
                currentRank={currentRankFormatted}
                nextRank={nextRankFormatted}
                progressPercentage={animatedPercentage}
                progressBarWidth={animatedProgress}
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
        <div className="hidden sm:grid sm:grid-cols-4 sm:gap-2 sm:w-full sm:max-w-4xl sm:mx-auto">
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
                  progressPercentage={animatedPercentage}
                  progressBarWidth={animatedProgress}
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
