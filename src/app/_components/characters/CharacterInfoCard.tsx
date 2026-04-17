import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { CharacterData } from "@/utils/character";

interface Character {
  name: string;
  guild_name?: string;
  race: string;
  class_name: string;
  level: number;
}

interface CharacterInfoCardProps {
  character: CharacterData;
}

const CharacterInfoCard: React.FC<CharacterInfoCardProps> = ({ character }) => {
  return (
    <Card className="bg-gray-900 border border-gray-800 shadow-none">
      <CardBody className="py-2 px-3">
        <div className="text-sm font-semibold text-white text-center">
          {character.heraldName}
        </div>
        {character.heraldGuildName && (
          <p className="text-xs text-gray-500 text-center my-0">
            <span>{`<${character.heraldGuildName}>`}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="text-xs text-gray-400">
            <span>{character.heraldRace}</span>
            {" \u00B7 "}
            <span>{character.heraldClassName}</span>
            {" \u00B7 "}
            <span>Level {character.heraldLevel}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-0.5">
          {character.heraldServerName}
        </p>
      </CardBody>
    </Card>
  );
};

export default CharacterInfoCard;
