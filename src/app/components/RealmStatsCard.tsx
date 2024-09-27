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
  albion: "bg-red-500",
  midgard: "bg-blue-500",
  hibernia: "bg-green-500",
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
    <Card className="bg-gray-800 text-white flex flex-col">
      <CardHeader className={`${realm.toLowerCase()} text-center py-1`}>
        <h3 className="text-base font-semibold m-0">
          {capitalizeRealm(realm)}
        </h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center px-1 text-sm flex-grow justify-between">
        <div className="flex flex-col items-center space-y-1 mt-1">
          <div className="w-full text-center">
            Kills: <span className="font-bold">{kills}</span>
          </div>
          <div className="w-full text-center">
            Death Blows: <span className="font-bold">{deathBlows}</span>
          </div>
          <div className="w-full text-center">
            Solo Kills: <span className="font-bold">{soloKills}</span>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mb-1">
          <CircularProgress
            size="sm"
            strokeWidth={4}
            classNames={{
              svg: "w-12 h-12 drop-shadow-md",
              indicator: "text-indigo-500",
              track: "stroke-white/10",
              value: "text-base font-semibold text-white",
            }}
            value={ratioOptions[selectedRatio].value}
            showValueLabel={true}
          />
          <div className="flex justify-center w-full mt-1">
            <ButtonGroup variant="flat" className="w-full px-1">
              {Object.entries(ratioOptions).map(([key, { label }]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedRatio(key as RatioKey)}
                  className={`text-xs py-1 px-2 ${
                    selectedRatio === key
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

export default RealmStatsCard;
