import React, { useState } from "react";
import { CircularProgress, Card, CardBody, CardHeader } from "@nextui-org/react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
      label: "DB / Kill",
      value: dbPerKillPercentage,
    },
    skPerKill: {
      label: "SK / Kill",
      value: skPerKillPercentage,
    },
  };

  return (
    <Card className="bg-gray-900 border border-gray-800 text-gray-100 shadow-none">
      <CardHeader className="py-1 px-3 border-b border-gray-800 bg-transparent">
        <h3 className="text-xs font-medium text-gray-400 m-0">Total</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center px-3 py-2 text-sm flex-grow justify-between">
        <div className="w-full divide-y divide-gray-800">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-400">Kills</span>
            <span className="text-xs font-semibold text-white tabular-nums">{kills}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">DBs</span>
              <span className="text-[11px] font-semibold text-white tabular-nums">{deathBlows}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">SKs</span>
              <span className="text-[11px] font-semibold text-white tabular-nums">{soloKills}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-400">Deaths</span>
            <span className="text-xs font-semibold text-white tabular-nums">{deaths}</span>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-2 pt-2 border-t border-gray-800">
          <CircularProgress
            size="md"
            strokeWidth={3}
            classNames={{
              svg: "w-14 h-14",
              indicator: "text-indigo-500",
              track: "stroke-white/10",
              value: "text-xs font-medium text-white",
            }}
            value={percentageOptions[selectedPercentage].value}
            showValueLabel={true}
          />
          <ToggleGroup
            value={selectedPercentage}
            onValueChange={(v) => setSelectedPercentage(v as PercentageKey)}
            className="mt-1.5"
          >
            {Object.entries(percentageOptions).map(([key, { label }]) => (
              <ToggleGroupItem key={key} value={key}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardBody>
    </Card>
  );
};

export default TotalStatsCard;
