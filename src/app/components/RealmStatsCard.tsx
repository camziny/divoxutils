import React from "react";
import {
  CircularProgress,
  Card,
  CardBody,
  Chip,
  CardHeader,
} from "@nextui-org/react";

interface RealmCardProps {
  realm: string;
  kills: string;
  deathBlows: string;
  soloKills: string;
  dbPerKillRatio: number;
}

type RealmColorsType = {
  [key: string]: string;
  albion: string;
  midgard: string;
  hibernia: string;
  total: string;
};

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
}) => {
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
            value={dbPerKillRatio}
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
    </Card>
  );
};

export default RealmStatsCard;
