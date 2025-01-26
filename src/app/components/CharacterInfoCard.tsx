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
    <Card className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 shadow-xl">
      <CardHeader className="flex justify-center items-center p-1 mb-0 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
        <div className="text-base md:text-lg font-bold m-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          {character.heraldName}
        </div>
      </CardHeader>
      <CardBody className="pt-0 pb-2 px-2">
        {character.heraldGuildName && (
          <p className="text-xs text-indigo-300 font-semibold text-center my-0">
            <span>{`<${character.heraldGuildName}>`}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="text-xs text-gray-300">
            <span className="font-semibold">{character.heraldRace}</span>
            {" • "}
            <span className="font-semibold">{character.heraldClassName}</span>
            {" • "}
            <span className="font-semibold">Level {character.heraldLevel}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 font-medium text-center mt-1">
          {character.heraldServerName}
        </p>
      </CardBody>
    </Card>
  );
};

export default CharacterInfoCard;
