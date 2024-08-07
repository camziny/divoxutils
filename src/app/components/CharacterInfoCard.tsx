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
    <Card className="bg-gray-800 text-white mb-3">
      <CardHeader className="flex justify-center items-center p-2 mb-0">
        <div className="text-xl md:text-2xl font-bold m-0">
          {character.heraldName}
        </div>
      </CardHeader>
      <CardBody className="pt-0 pb-4 px-4">
        {character.heraldGuildName && (
          <p className="text-sm text-gray-300 font-semibold text-center my-0">
            <span>{`<${character.heraldGuildName}>`}</span>
          </p>
        )}
        <p className="text-sm text-gray-300 font-semibold text-center mt-1">
          {`${character.heraldRace} ${character.heraldClassName}, Lvl ${character.heraldLevel}`}
        </p>
      </CardBody>
    </Card>
  );
};

export default CharacterInfoCard;
