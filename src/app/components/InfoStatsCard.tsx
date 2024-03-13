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
    <Card className="bg-gray-800 text-white flex flex-col h-full">
      <CardHeader className="text-center bg-indigo-500">Info</CardHeader>
      <CardBody className="flex flex-col items-center px-2 text-sm flex-grow">
        <div className="flex flex-col space-y-2 mb-4 min-h-[50px]">
          {" "}
          <div className="text-center my-2">
            Total RP: <span className="font-bold">{totalRP}</span>
          </div>
          <div className="text-center my-2">
            IRS:{" "}
            <span className="font-bold">{irs !== undefined ? irs : "N/A"}</span>
          </div>
          <div className="text-center my-2">
            RPs This Week:{" "}
            <span className="font-bold">{realmPointsThisWeek}</span>
          </div>
          <div className="text-center my-2">
            RPs Last Week:{" "}
            <span className="font-bold">{realmPointsLastWeek}</span>
          </div>
          <div className="text-center my-2">
            RPs to <span className="font-extrabold">{nextRank}</span>:{" "}
            <span className="font-bold">{rpsToNextRank}</span>
          </div>
        </div>
        <div className="mt-auto w-full p-2 mb-4">
          <Progress
            size="md"
            radius="sm"
            classNames={{
              base: "max-w-md mx-auto",
              track: "drop-shadow-md border border-default bg-gray-300",
              indicator: "customIndicator",
              label: "tracking-wider font-bold text-xl text-gray-400",
              value: "text-xl font-bold text-indigo-400",
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
