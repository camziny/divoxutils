import React from "react";
import { Card, CardBody, CardHeader, Progress } from "@nextui-org/react";

interface InfoStatsCardProps {
  totalRP: string;
  irs: string | undefined;
  rpsToNextRank: string;
  currentRank: string;
  nextRank: string;
  progressPercentage: number;
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
  realmPointsLastWeek,
  realmPointsThisWeek,
}) => {
  return (
    <Card className="bg-gray-800 text-white flex flex-col">
      <CardHeader className="text-center bg-indigo-500 py-1">
        <h3 className="text-base font-semibold m-0">Info</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center px-1 text-sm flex-grow justify-between">
        <div className="flex flex-col items-center space-y-1 mt-1">
          <div className="text-center">
            Total RP: <span className="font-bold">{totalRP}</span>
          </div>
          <div className="text-center">
            IRS:{" "}
            <span className="font-bold">{irs !== undefined ? irs : "N/A"}</span>
          </div>
          <div className="text-center">
            RPs This Week:{" "}
            <span className="font-bold">
              {totalRP === realmPointsThisWeek ? 0 : realmPointsThisWeek}
            </span>
          </div>
          <div className="text-center">
            RPs Last Week:{" "}
            <span className="font-bold">{realmPointsLastWeek}</span>
          </div>
          <div className="text-center">
            RPs to <span className="font-extrabold">{nextRank}</span>:{" "}
            <span className="font-bold">{rpsToNextRank}</span>
          </div>
        </div>
        <div className="w-full mt-1 mb-1">
          <Progress
            size="md"
            radius="sm"
            classNames={{
              base: "w-full",
              track: "drop-shadow-md border border-default bg-gray-300",
              indicator: "customIndicator",
              label: "tracking-wide font-bold text-base text-gray-400",
              value: "text-base font-bold text-indigo-400",
            }}
            label={currentRank}
            value={progressPercentage}
            showValueLabel={true}
          />
        </div>
      </CardBody>
    </Card>
  );
};

export default InfoStatsCard;
