import React, { useState } from "react";
import {
  CircularProgress,
  Card,
  CardBody,
  Chip,
  CardHeader,
  Button,
  ButtonGroup,
} from "@nextui-org/react";

interface RealmCardProps {
  realm: string;
  kills: string;
  deathBlows: string;
  soloKills: string;
  dbPerKillRatio: number;
  skPerKillRatio: number;
}

type RealmColorsType = {
  [key: string]: string;
  albion: string;
  midgard: string;
  hibernia: string;
  total: string;
};

type RatioKey = "dbPerKill" | "skPerKill";

const realmColors: RealmColorsType = {
  albion: "bg-gradient-to-r from-red-800/20 to-red-700/20",
  midgard: "bg-gradient-to-r from-blue-800/20 to-blue-700/20",
  hibernia: "bg-gradient-to-r from-green-800/20 to-green-700/20",
  total: "bg-gray-600",
};

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
      label: "DB / Kill Ratio",
      value: dbPerKillRatio,
    },
    skPerKill: {
      label: "SK / Kill Ratio",
      value: skPerKillRatio,
    },
  };

  return (
    <Card className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 shadow-xl text-gray-100">
      <CardHeader className={`${realm.toLowerCase()} text-center py-1`}>
        <h3 className="text-sm font-semibold m-0">{capitalizeRealm(realm)}</h3>
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
            value={ratioOptions[selectedRatio].value}
            showValueLabel={true}
          />
          <div className="flex justify-center w-full mt-1">
            <ButtonGroup variant="flat" className="w-full px-1" size="sm">
              {Object.entries(ratioOptions).map(([key, { label }]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedRatio(key as RatioKey)}
                  className={`text-[10px] py-0 ${
                    selectedRatio === key
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

export default RealmStatsCard;
