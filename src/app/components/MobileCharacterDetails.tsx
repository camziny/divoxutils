import React, { useEffect, useState } from "react";
import { CharacterData } from "@/utils/character";
import { 
  getRealmRankForPoints,
  formatRealmRankWithLevel,
  calculateProgressPercentage,
  getRealmRanks
} from "@/utils/character";
import { getRealmSurfaceClass } from "./characterTileTheme";

interface MobileCharacterDetailsProps {
  character: CharacterData;
  opponentRealms: string[];
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalRealmPoints: number;
  compact?: boolean;
}

const MobileCharacterDetails: React.FC<MobileCharacterDetailsProps> = ({
  character,
  opponentRealms,
  realmPointsLastWeek,
  realmPointsThisWeek,
  totalRealmPoints,
  compact = false,
}) => {
  const realmPoints = character.heraldRealmPoints || 0;
  const currentRank = getRealmRankForPoints(realmPoints);
  const nextRankPoints = getRealmRanks().get(currentRank + 1) || 0;
  const progressPercentage = calculateProgressPercentage(realmPoints, nextRankPoints);
  const currentRankFormatted = formatRealmRankWithLevel(currentRank);
  const nextRankFormatted = formatRealmRankWithLevel(currentRank + 1);
  
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
  
  const totalKills = character.player_kills?.total?.kills || 0;
  const totalDeaths = character.player_kills?.total?.deaths || 0;
  const totalDeathBlows = character.player_kills?.total?.death_blows || 0;
  const totalSoloKills = character.player_kills?.total?.solo_kills || 0;
  const totalBountyPoints = character.heraldBountyPoints || 0;
  
  const irs = totalDeaths === 0 ? 0 : Math.round(realmPoints / totalDeaths);
  const dbPerKillRatio = totalKills === 0 ? 0 : ((totalDeathBlows / totalKills) * 100).toFixed(1);
  const skPerKillRatio = totalKills === 0 ? 0 : ((totalSoloKills / totalKills) * 100).toFixed(1);

  const formatNumber = (num: any) => {
    if (typeof num === "number") return num.toLocaleString();
    return "0";
  };

  const label = compact ? "text-[10px] text-gray-400" : "text-xs text-gray-400";
  const value = compact ? "text-[11px] font-semibold text-white" : "text-base font-semibold text-white";
  const valueSmall = compact ? "text-[11px] font-semibold text-white" : "text-sm font-semibold text-white";
  const heading = compact ? "text-[11px] font-medium text-white" : "text-sm font-medium text-white";
  const badge = compact
    ? "bg-gray-800 px-1 py-px rounded text-[9px] text-gray-400"
    : "bg-gray-800 px-2 py-0.5 rounded text-gray-400";
  const card = compact ? "bg-gray-800/30 rounded p-1.5" : "bg-gray-800/30 rounded-md p-2";
  const outer = compact
    ? "rounded p-1.5 mx-1 bg-gray-900/20"
    : "rounded-md border border-gray-800 p-3 mx-3 bg-gray-900/20";
  const sectionGap = compact ? "mb-1.5" : "mb-3";
  const barHeight = compact ? "h-1" : "h-2";

  return (
    <div className={outer}>
      <div className={`text-center ${sectionGap} ${compact ? "pb-1" : "pb-2"} border-b border-gray-800`}>
        <h3 className={`${compact ? "text-[11px]" : "text-base"} font-semibold text-white ${compact ? "mb-0.5" : "mb-1"}`}>{character.heraldName}</h3>
        {character.heraldGuildName && (
          <div className={`${compact ? "text-[10px]" : "text-xs"} text-indigo-300 ${compact ? "mb-0.5" : "mb-1"}`}>
            &lt;{character.heraldGuildName}&gt;
          </div>
        )}
        <div className={`${compact ? "text-[10px]" : "text-xs"} text-gray-400 space-x-2`}>
          <span className="text-indigo-300">{character.heraldClassName}</span>
          <span>•</span>
          <span>{character.heraldRace}</span>
          <span>•</span>
          <span>{character.heraldLevel || "50"}</span>
        </div>
      </div>

      <div className={sectionGap}>
        <div className={`flex items-center justify-between ${compact ? "mb-0.5" : "mb-1"}`}>
          <span className={heading}>{currentRankFormatted}</span>
          <span className={`${compact ? "text-[10px]" : "text-sm"} font-medium text-indigo-400`}>
            {animatedPercentage.toFixed(1)}%
          </span>
        </div>
        <div className={`w-full bg-gray-800 rounded-full ${barHeight} overflow-hidden ${compact ? "mb-0.5" : "mb-1"}`}>
          <div 
            className="h-full bg-indigo-500"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        <div className={`text-center ${compact ? "text-[10px]" : "text-xs"} text-gray-400`}>
          <span className="text-gray-300">{formatNumber(nextRankPoints - realmPoints)} RP</span> to <span className={`text-indigo-300 ${compact ? "text-[10px]" : "text-sm"}`}>{nextRankFormatted}</span>
        </div>
      </div>

      <div className={`grid grid-cols-3 ${compact ? "gap-1" : "gap-2"} ${sectionGap}`}>
        <div className={card}>
          <div className={label}>Total RP</div>
          <div className={value}>{formatNumber(realmPoints)}</div>
        </div>
        <div className={card}>
          <div className={label}>Total BPs</div>
          <div className={value}>{formatNumber(totalBountyPoints)}</div>
        </div>
        <div className={card}>
          <div className={label}>IRS</div>
          <div className={value}>{formatNumber(irs)}</div>
        </div>
      </div>

      <div className={`${card} ${sectionGap}`}>
        <div className={`${label} ${compact ? "mb-0.5" : "mb-1.5"}`}>Weekly Progress</div>
        <div className="flex justify-between items-center">
          <div>
            <div className={`${compact ? "text-[10px]" : "text-xs"} text-gray-300`}>Last Week</div>
            <div className={valueSmall}>
              {formatNumber(realmPointsLastWeek === totalRealmPoints ? 0 : realmPointsLastWeek)}
            </div>
          </div>
          <div className={`text-gray-600 ${compact ? "text-sm" : "text-lg"}`}>→</div>
          <div className="text-right">
            <div className={`${compact ? "text-[10px]" : "text-xs"} text-gray-300`}>This Week</div>
            <div className={valueSmall}>
              {formatNumber(realmPointsThisWeek)}
            </div>
          </div>
        </div>
      </div>

      <div className={compact ? "space-y-1" : "space-y-1.5"}>
        <div className={card}>
          <div className={`flex items-center justify-between ${compact ? "mb-1" : "mb-2"}`}>
            <span className={heading}>Total</span>
            <div className={`flex ${compact ? "gap-1" : "gap-2"} ${compact ? "text-[9px]" : "text-xs"}`}>
              <span className={badge}>
                DB {dbPerKillRatio}%
              </span>
              <span className={badge}>
                SK {skPerKillRatio}%
              </span>
            </div>
          </div>
          <div className={`grid grid-cols-4 ${compact ? "gap-1" : "gap-2"} text-center`}>
            <div className={compact ? "py-0" : "py-1"}>
              <div className={label}>Kills</div>
              <div className={valueSmall}>{formatNumber(totalKills)}</div>
            </div>
            <div className={compact ? "py-0" : "py-1"}>
              <div className={label}>Deaths</div>
              <div className={valueSmall}>{formatNumber(totalDeaths)}</div>
            </div>
            <div className={compact ? "py-0" : "py-1"}>
              <div className={label}>DBs</div>
              <div className={valueSmall}>{formatNumber(totalDeathBlows)}</div>
            </div>
            <div className={compact ? "py-0" : "py-1"}>
              <div className={label}>SKs</div>
              <div className={valueSmall}>{formatNumber(totalSoloKills)}</div>
            </div>
          </div>
        </div>

        {opponentRealms.map((realm) => {
          const realmLower = realm.toLowerCase();
          const realmKey = realmLower as keyof typeof character.player_kills;
          const realmStats = character.player_kills?.[realmKey];
          
          const kills = realmStats?.kills || 0;
          const deathBlows = realmStats?.death_blows || 0;
          const soloKills = realmStats?.solo_kills || 0;
          
          const realmDbRatio = kills === 0 ? 0 : ((deathBlows / kills) * 100).toFixed(1);
          const realmSkRatio = kills === 0 ? 0 : ((soloKills / kills) * 100).toFixed(1);

          return (
            <div key={realm} className={`${getRealmSurfaceClass(realm)} ${compact ? "rounded p-1.5" : "rounded-md p-2"}`}>
              <div className={`flex items-center justify-between ${compact ? "mb-0.5" : "mb-1.5"}`}>
                <span className={heading}>{realm}</span>
                <div className={`flex ${compact ? "gap-1" : "gap-2"} ${compact ? "text-[9px]" : "text-xs"}`}>
                  <span className={badge}>
                    DB {realmDbRatio}%
                  </span>
                  <span className={badge}>
                    SK {realmSkRatio}%
                  </span>
                </div>
              </div>
              
              <div className={`grid grid-cols-3 ${compact ? "gap-1" : "gap-1.5"} text-center`}>
                <div className={compact ? "py-0" : "py-1"}>
                  <div className={label}>Kills</div>
                  <div className={valueSmall}>{formatNumber(kills)}</div>
                </div>
                <div className={compact ? "py-0" : "py-1"}>
                  <div className={label}>DBs</div>
                  <div className={valueSmall}>{formatNumber(deathBlows)}</div>
                </div>
                <div className={compact ? "py-0" : "py-1"}>
                  <div className={label}>SKs</div>
                  <div className={valueSmall}>{formatNumber(soloKills)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCharacterDetails;
