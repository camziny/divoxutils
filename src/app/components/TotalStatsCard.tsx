import React, { useState } from "react";
import {
  CircularProgress,
  Card,
  CardBody,
  Chip,
  CardFooter,
  CardHeader,
  Button,
  ButtonGroup,
} from "@nextui-org/react";

interface TotalStatsCardProps {
  kills: string;
  deathBlows: string;
  soloKills: string;
  deaths: string;
  dbPerKillPercentage: number;
  skPerKillPercentage: number;
}

type PercentageKey = "dbPerKill" | "skPerKill";

const TotalStatsCard: React.FC<TotalStatsCardProps> = ({
  kills,
  deathBlows,
  soloKills,
  deaths,
  dbPerKillPercentage,
  skPerKillPercentage,
}) => {
  const [selectedPercentage, setSelectedPercentage] =
    useState<PercentageKey>("dbPerKill");

  const percentageOptions = {
    dbPerKill: {
      label: "DB / Kill Ratio",
      value: dbPerKillPercentage,
    },
    skPerKill: {
      label: "SK / Kill Ratio",
      value: skPerKillPercentage,
    },
  };
  return (
    <Card className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 shadow-xl text-gray-100">
      <CardHeader className="text-center py-0.5 bg-gray-700">
        <h3 className="text-sm font-semibold m-0">Total</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center px-2 py-1 text-sm flex-grow justify-between">
        <div className="grid grid-cols-2 gap-1 w-full">
          <div className="col-span-2 text-center text-xs p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-gray-300">Kills:</span>
              <span className="font-bold text-gray-100">{kills}</span>
            </div>
          </div>
          <div className="col-span-1 text-center text-[11px] p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-300">Deathblows</span>
              <span className="font-bold text-gray-100">{deathBlows}</span>
            </div>
          </div>
          <div className="col-span-1 text-center text-[11px] p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-300">Solo Kills</span>
              <span className="font-bold text-gray-100">{soloKills}</span>
            </div>
          </div>
          <div className="col-span-2 text-center text-xs p-0.5 rounded-lg bg-gray-700/50 border border-gray-600/30">
            <div className="flex items-center justify-between px-2">
              <span className="text-gray-300">Deaths:</span>
              <span className="font-bold text-gray-100">{deaths}</span>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-1">
          <CircularProgress
            size="sm"
            strokeWidth={4}
            classNames={{
              svg: "w-12 h-12 drop-shadow-xl",
              indicator: "text-indigo-500",
              track: "stroke-white/10",
              value: "text-sm font-semibold text-white",
            }}
            value={percentageOptions[selectedPercentage].value}
            showValueLabel={true}
          />
          <div className="flex justify-center w-full mt-1">
            <ButtonGroup variant="flat" className="w-full px-1" size="sm">
              {Object.entries(percentageOptions).map(([key, { label }]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedPercentage(key as PercentageKey)}
                  className={`text-[10px] py-0 ${
                    selectedPercentage === key
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white"
                      : "bg-gray-700/50 text-gray-300 border border-gray-600/30"
                  }`}
                  style={{ minHeight: "20px" }}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default TotalStatsCard;
