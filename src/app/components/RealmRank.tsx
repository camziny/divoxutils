import React from "react";
import {
  getRealmRankForPoints,
  getNextRealmRank,
  getRealmRankThreshold,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
} from "@/utils/character";

interface RealmRankProps {
  realmPoints: number;
}

function getPointsUntilNextRank(currentPoints: number): number {
  const currentRank = getRealmRankForPoints(currentPoints);
  const nextRank = getNextRealmRank(currentRank);
  if (nextRank === null) {
    return 0;
  }
  const nextRankPoints = getRealmRankThreshold(nextRank);
  if (nextRankPoints === undefined) {
    return 0;
  }
  return nextRankPoints - currentPoints;
}

const RealmRank: React.FC<RealmRankProps> = ({ realmPoints }) => {
  const currentRank = getRealmRankForPoints(realmPoints);
  const nextRank = getNextRealmRank(currentRank);

  return (
    <div>
      <p>
        Current Rank: {formatRealmRankWithLevel(currentRank)}
      </p>
      {nextRank !== null && (
        <p>
          Realm points until {formatRealmRankWithLevel(nextRank)}:
          {new Intl.NumberFormat().format(getPointsUntilNextRank(realmPoints))}
        </p>
      )}
    </div>
  );
};

export {
  getRealmRankForPoints,
  getNextRealmRank,
  getRealmRankThreshold,
  calculateProgressPercentage,
  formatRealmRankWithLevel,
};

export default RealmRank;
