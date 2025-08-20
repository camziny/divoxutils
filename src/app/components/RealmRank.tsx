import React from "react";
import {
  getRealmRanks,
  getRealmRankForPoints,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
} from "@/utils/character";

interface RealmRankProps {
  realmPoints: number;
}

function getPointsUntilNextRank(currentPoints: number): number {
  const realmRanksMap = getRealmRanks();
  const currentRank = getRealmRankForPoints(currentPoints);
  const nextRankPoints = realmRanksMap.get(currentRank + 1);
  if (nextRankPoints === undefined) {
    return 0;
  }
  return nextRankPoints - currentPoints;
}

const RealmRank: React.FC<RealmRankProps> = ({ realmPoints }) => {
  return (
    <div>
      <p>
        Current Rank: {formatRealmRankWithLevel(getRealmRankForPoints(realmPoints))}
      </p>
      <p>
        Realm points until {formatRealmRankWithLevel(getRealmRankForPoints(realmPoints) + 1)}:
        {new Intl.NumberFormat().format(getPointsUntilNextRank(realmPoints))}
      </p>
    </div>
  );
};

export {
  getRealmRankForPoints,
  getRealmRanks,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
};

export default RealmRank;
