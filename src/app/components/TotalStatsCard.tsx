import React from "react";
import {
  CircularProgress,
  Card,
  CardBody,
  Chip,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";

interface TotalStatsCardProps {
  kills: string;
  deathBlows: string;
  soloKills: string;
  deaths: string;
  dbPerKillPercentage: number;
}

const TotalStatsCard: React.FC<TotalStatsCardProps> = ({
  kills,
  deathBlows,
  soloKills,
  deaths,
  dbPerKillPercentage,
}) => {
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
          {" "}
          <CircularProgress
            size="lg"
            strokeWidth={4}
            classNames={{
              svg: "w-16 h-16 drop-shadow-md",
              indicator: "success",
              track: "stroke-white/10",
              value: "text-xl font-semibold text-white",
            }}
            value={dbPerKillPercentage}
            showValueLabel={true}
          />
          <Chip
            classNames={{
              base: "border-1 border-white/30",
              content: "text-gray-800/90 text-xs font-semibold",
            }}
            variant="solid"
          >
            DB / Kill Ratio
          </Chip>
        </div>
      </CardBody>
      <CardFooter className="justify-center items-center pt-0"></CardFooter>
    </Card>
  );
};

export default TotalStatsCard;
