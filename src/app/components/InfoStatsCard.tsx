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
  const barWidth = progressBarWidth !== undefined ? progressBarWidth : progressPercentage;
  
  return (
    <Card className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 shadow-xl text-gray-100">
      <CardHeader className="text-center py-0.5 bg-gradient-to-r from-indigo-500/90 to-indigo-700/90">
        <h3 className="text-sm font-semibold m-0">Info</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center px-2 py-1 text-sm flex-grow justify-between">
        <div className="flex flex-col items-center space-y-1 w-full">
          <div className="w-full text-center text-xs p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-gray-300">Total RP:</span>
              <span className="font-bold text-gray-100 ml-1">{totalRP}</span>
            </div>
          </div>
          <div className="w-full text-center text-xs p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-gray-300">IRS:</span>
              <span className="font-bold text-gray-100 ml-1">
                {irs !== undefined ? irs : "N/A"}
              </span>
            </div>
          </div>
          <div className="w-full text-center text-xs p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-gray-300">RPs This Week:</span>
              <span className="font-bold text-gray-100">{realmPointsThisWeek}</span>
            </div>
          </div>
          <div className="w-full text-center text-xs p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-gray-300">RPs Last Week:</span>
              <span className="font-bold text-gray-100">{realmPointsLastWeek}</span>
            </div>
          </div>
        </div>
        <div className="w-full mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">{currentRank}</span>
            <span className="text-sm font-medium text-indigo-400">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="text-center text-xs mt-1 text-gray-400">
            <span className="font-bold text-indigo-400">{rpsToNextRank}</span> RPs to {nextRank}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default InfoStatsCard;
