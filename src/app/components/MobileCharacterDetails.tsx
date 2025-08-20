import React, { useEffect, useState } from "react";
import { CharacterData } from "@/utils/character";
import { 
  getRealmRankForPoints,
  formatRealmRankWithLevel,
  calculateProgressPercentage,
  getRealmRanks
} from "@/utils/character";

interface MobileCharacterDetailsProps {
  character: CharacterData;
  opponentRealms: string[];
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalRealmPoints: number;
}

const MobileCharacterDetails: React.FC<MobileCharacterDetailsProps> = ({
  character,
  opponentRealms,
  realmPointsLastWeek,
  realmPointsThisWeek,
  totalRealmPoints,
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
  
  const irs = totalDeaths === 0 ? 0 : Math.round(realmPoints / totalDeaths);
  const dbPerKillRatio = totalKills === 0 ? 0 : ((totalDeathBlows / totalKills) * 100).toFixed(1);
  const skPerKillRatio = totalKills === 0 ? 0 : ((totalSoloKills / totalKills) * 100).toFixed(1);

  const formatNumber = (num: any) => {
    if (typeof num === "number") return num.toLocaleString();
    return "0";
  };

  return (
    <div className="bg-gray-900/95 rounded-xl p-3 mx-3 shadow-lg">
      <div className="text-center mb-3 pb-2 border-b border-gray-800">
        <h3 className="text-base font-semibold text-white mb-1">{character.heraldName}</h3>
        {character.heraldGuildName && (
          <div className="text-xs text-indigo-300 mb-1">
            &lt;{character.heraldGuildName}&gt;
          </div>
        )}
        <div className="text-xs text-gray-400 space-x-2">
          <span className="text-indigo-300">{character.heraldClassName}</span>
          <span>•</span>
          <span>{character.heraldLevel || "50"}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white">{currentRankFormatted}</span>
          <span className="text-sm font-medium text-indigo-400">
            {animatedPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-1">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-400">
          <span className="text-gray-300">{formatNumber(nextRankPoints - realmPoints)} RP</span> to <span className="text-indigo-300 text-sm">{nextRankFormatted}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-xs text-gray-400">Total RP</div>
          <div className="text-base font-bold text-white">{formatNumber(realmPoints)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="text-xs text-gray-400">IRS</div>
          <div className="text-base font-bold text-white">{formatNumber(irs)}</div>
        </div>
      </div>

      <div className="bg-gray-800/30 rounded-lg p-2 mb-3">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Weekly Progress</div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-300">Last Week</div>
            <div className="text-sm font-semibold text-white">
              {formatNumber(realmPointsLastWeek === totalRealmPoints ? 0 : realmPointsLastWeek)}
            </div>
          </div>
          <div className="text-gray-600 text-lg">→</div>
          <div className="text-right">
            <div className="text-xs text-gray-300">This Week</div>
            <div className="text-sm font-semibold text-white">
              {formatNumber(realmPointsThisWeek)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="bg-gray-800/30 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Total</span>
            <div className="flex gap-3 text-xs">
              <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">
                DB {dbPerKillRatio}%
              </span>
              <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">
                SK {skPerKillRatio}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-700/30 rounded-md py-2 px-1">
              <div className="text-xs text-gray-400 mb-1">Kills</div>
              <div className="text-sm font-semibold text-white">{formatNumber(totalKills)}</div>
            </div>
            <div className="bg-gray-700/30 rounded-md py-2 px-1">
              <div className="text-xs text-gray-400 mb-1">Deaths</div>
              <div className="text-sm font-semibold text-white">{formatNumber(totalDeaths)}</div>
            </div>
            <div className="bg-gray-700/30 rounded-md py-2 px-1">
              <div className="text-xs text-gray-400 mb-1">DBs</div>
              <div className="text-sm font-semibold text-white">{formatNumber(totalDeathBlows)}</div>
            </div>
            <div className="bg-gray-700/30 rounded-md py-2 px-1">
              <div className="text-xs text-gray-400 mb-1">SKs</div>
              <div className="text-sm font-semibold text-white">{formatNumber(totalSoloKills)}</div>
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

          const realmColorMap: { [key: string]: string } = {
            albion: "from-red-800/20 to-red-700/20",
            midgard: "from-blue-800/20 to-blue-700/20", 
            hibernia: "from-green-800/20 to-green-700/20"
          };

          return (
            <div key={realm} className={`bg-gradient-to-r ${realmColorMap[realmLower]} rounded-lg p-2`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-white">{realm}</span>
                <div className="flex gap-2 text-xs">
                  <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">
                    DB {realmDbRatio}%
                  </span>
                  <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">
                    SK {realmSkRatio}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-gray-800/30 rounded-md py-1.5 px-1 text-center">
                    <div className="text-xs text-gray-400">Kills</div>
                    <div className="text-sm font-semibold text-white">{formatNumber(kills)}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-md py-1.5 px-1 text-center">
                    <div className="text-xs text-gray-400">DBs</div>
                    <div className="text-sm font-semibold text-white">{formatNumber(deathBlows)}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-md py-1.5 px-1 text-center">
                    <div className="text-xs text-gray-400">SKs</div>
                    <div className="text-sm font-semibold text-white">{formatNumber(soloKills)}</div>
                  </div>
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
