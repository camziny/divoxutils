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
    <Card className="bg-gray-800 text-white flex flex-col h-full mb-2">
      <CardHeader className={`${realm.toLowerCase()} text-center`}>
        {capitalizeRealm(realm)}
      </CardHeader>
      <CardBody className="flex flex-col items-center px-2 text-sm flex-grow">
        <div className="flex flex-col space-y-2 mb-4 min-h-[50px]">
          <div className="w-full text-center">
            Kills: <span className="font-bold">{kills}</span>
          </div>
          <div className="w-full text-center">
            Death Blows: <span className="font-bold">{deathBlows}</span>
          </div>
          <div className="w-full text-center">
            Solo Kills: <span className="font-bold">{soloKills}</span>
          </div>
          <div className="w-full text-center invisible">Placeholder</div>
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
            value={ratioOptions[selectedRatio].value}
            showValueLabel={true}
          />
          <div className="flex justify-center w-full my-2">
            <ButtonGroup variant="flat" style={{ width: "95%" }}>
              {Object.entries(ratioOptions).map(([key, { label }]) => (
                <Button
                  key={key}
                  onClick={() => setSelectedRatio(key as RatioKey)}
                  className={
                    selectedRatio === key
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
    </Card>
  );
};

export default RealmStatsCard;
