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
    <Card className="bg-gray-800 text-white flex flex-col">
      <CardHeader className="text-center bg-gray-700 py-1">
        <h3 className="text-sm font-semibold m-0">Total</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center px-1 text-sm flex-grow justify-between">
        <div className="flex flex-col items-center space-y-1 mt-1">
          <div className="w-full text-center text-xs">
            Kills: <span className="font-bold">{kills}</span>
          </div>
          <div className="w-full text-center text-xs">
            Death Blows: <span className="font-bold">{deathBlows}</span>
          </div>
          <div className="w-full text-center text-xs">
            Solo Kills: <span className="font-bold">{soloKills}</span>
          </div>
          <div className="w-full text-center text-xs">
            Deaths: <span className="font-bold">{deaths}</span>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-1 mb-1">
          <CircularProgress
            size="sm"
            strokeWidth={4}
            classNames={{
              svg: "w-12 h-12 drop-shadow-md",
              indicator: "text-indigo-500",
              track: "stroke-white/10",
              value: "text-base font-semibold text-white",
            }}
            value={percentageOptions[selectedPercentage].value}
            showValueLabel={true}
          />
          <div className="flex justify-center w-full mt-1">
            <ButtonGroup variant="flat" className="w-full px-1">
              {Object.entries(percentageOptions).map(([key, { label }]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedPercentage(key as PercentageKey)}
                  className={`text-xs py-1 px-2 ${
                    selectedPercentage === key
                      ? "bg-indigo-500 text-white"
                      : "bg-white text-gray-800"
                  }`}
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
