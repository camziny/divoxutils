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
    <Card className="bg-gray-800 text-white flex flex-col h-full">
      <CardHeader className="text-center bg-gray-700">Total</CardHeader>
      <CardBody className="flex flex-col items-center px-2 text-sm flex-grow">
        <div className="flex flex-col space-y-2 mb-4 min-h-[50px]">
          {" "}
          <div className="w-full text-center">
            Kills: <span className="font-bold">{kills}</span>
          </div>
          <div className="w-full text-center">
            Death Blows: <span className="font-bold">{deathBlows}</span>
          </div>
          <div className="w-full text-center">
            Solo Kills: <span className="font-bold">{soloKills}</span>
          </div>
          <div className="w-full text-center">
            Deaths: <span className="font-bold">{deaths}</span>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-0">
          <CircularProgress
            size="lg"
            strokeWidth={4}
            classNames={{
              svg: "w-16 h-16 drop-shadow-md",
              indicator: "success",
              track: "stroke-white/10",
              value: "text-xl font-semibold text-white",
            }}
            value={percentageOptions[selectedPercentage].value}
            showValueLabel={true}
          />
          <div className="flex justify-center w-full my-2">
            <ButtonGroup variant="flat" style={{ width: "95%" }}>
              {Object.entries(percentageOptions).map(([key, { label }]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedPercentage(key as PercentageKey)}
                  className={
                    selectedPercentage === key
                      ? "bg-indigo-500/90 text-white text-xs"
                      : "bg-white text-gray-800 text-xs"
                  }
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      </CardBody>
      <CardFooter className="justify-center items-center pt-0"></CardFooter>
    </Card>
  );
};

export default TotalStatsCard;
