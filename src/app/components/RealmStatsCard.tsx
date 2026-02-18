import React, { useState } from "react";
import { CircularProgress, Card, CardBody, CardHeader } from "@nextui-org/react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface RealmCardProps {
  realm: string;
  kills: string;
  deathBlows: string;
  soloKills: string;
  dbPerKillRatio: number;
  skPerKillRatio: number;
}

type RatioKey = "dbPerKill" | "skPerKill";

const capitalizeRealm = (realm: string) => {
  return realm.charAt(0).toUpperCase() + realm.slice(1);
};

const RealmStatsCard: React.FC<RealmCardProps> = ({
  realm,
  kills,
  deathBlows,
  soloKills,
  dbPerKillRatio,
  skPerKillRatio,
}) => {
  const [selectedRatio, setSelectedRatio] = useState<RatioKey>("dbPerKill");
  const ratioOptions = {
    dbPerKill: {
      label: "DB / Kill",
      value: dbPerKillRatio,
    },
    skPerKill: {
      label: "SK / Kill",
      value: skPerKillRatio,
    },
  };

  return (
    <Card className="bg-gray-900 border border-gray-800 text-gray-100 shadow-none">
      <CardHeader className={`${realm.toLowerCase()} py-1 px-3`}>
        <h3 className="text-xs font-medium m-0">{capitalizeRealm(realm)}</h3>
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
            value={ratioOptions[selectedRatio].value}
            showValueLabel={true}
          />
          <ToggleGroup
            value={selectedRatio}
            onValueChange={(v) => setSelectedRatio(v as RatioKey)}
            className="mt-1.5"
          >
            {Object.entries(ratioOptions).map(([key, { label }]) => (
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

export default RealmStatsCard;
