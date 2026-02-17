import React from "react";
import { Card, CardBody, CardHeader, Progress } from "@nextui-org/react";

interface InfoStatsCardProps {
  totalRP: string;
  irs: string | undefined;
  rpsToNextRank: string;
  currentRank: string;
  nextRank: string;
  progressPercentage: number;
  progressBarWidth?: number;
  realmPointsLastWeek: string;
  realmPointsThisWeek: string;
}

const InfoStatsCard: React.FC<InfoStatsCardProps> = ({
  totalRP,
  irs,
  rpsToNextRank,
  nextRank,
  currentRank,
  progressPercentage,
  progressBarWidth,
  realmPointsLastWeek,
  realmPointsThisWeek,
}) => {
  const isMaxRank = currentRank?.trim() === "16L0";
  const displayProgress = isMaxRank ? 0 : progressPercentage;
  const barWidth = isMaxRank
    ? 0
    : progressBarWidth !== undefined
    ? progressBarWidth
    : progressPercentage;
  const normalizedThisWeek = (() => {
    const numeric = Number(String(realmPointsThisWeek).replace(/,/g, "").trim());
    if (Number.isFinite(numeric) && numeric < 0) return "0";
    return realmPointsThisWeek;
  })();
  
  return (
    <Card className="bg-gray-900 border border-gray-800 text-gray-100 shadow-none">
      <CardHeader className="py-1 px-3 border-b border-gray-800 bg-transparent">
        <h3 className="text-xs font-medium text-gray-400 m-0">Info</h3>
      </CardHeader>
      <CardBody className="flex flex-col px-3 py-2 text-sm flex-grow justify-between gap-0">
        <div className="flex flex-col w-full divide-y divide-gray-800">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-400">Total RP</span>
            <span className="text-xs font-semibold text-white tabular-nums">{totalRP}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-400">IRS</span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {irs !== undefined ? irs : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-400">RPs Last Week</span>
            <span className="text-xs font-semibold text-white tabular-nums">{realmPointsLastWeek}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-400">RPs This Week</span>
            <span className="text-xs font-semibold text-white tabular-nums">{normalizedThisWeek}</span>
          </div>
        </div>
        <div className="w-full mt-2 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-300">{currentRank}</span>
            <span className="text-xs font-medium text-indigo-400 tabular-nums">
              {displayProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {!isMaxRank && (
            <div className="text-center text-[11px] mt-1 text-gray-500">
              <span className="font-semibold text-indigo-400">{rpsToNextRank}</span> RPs to {nextRank}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default InfoStatsCard;
