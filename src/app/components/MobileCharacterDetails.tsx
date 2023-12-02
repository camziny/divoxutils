import React from "react";
import { TableCell } from "@mui/material";
import {
  CharacterInfo,
  getRealmNameAndColor,
  getRealmRankForPoints,
  formatRealmRankWithLevel,
  calculateProgressPercentage,
} from "@/utils/character";
import LinearProgress from "@mui/material/LinearProgress";

type MobileCharacterDetailsProps = {
  character: CharacterInfo;
};

const MobileCharacterDetails: React.FC<MobileCharacterDetailsProps> = ({
  character,
}) => {
  const realmPoints = character.realm_war_stats?.current?.realm_points || 0;
  const realmRank = formatRealmRankWithLevel(
    getRealmRankForPoints(realmPoints)
  );
  const nextRankPoints = character.nextRankPoints || 0;
  const progressPercentage = calculateProgressPercentage(
    realmPoints,
    nextRankPoints
  );

  return (
    <TableCell colSpan={9}>
      <div className="flex flex-col items-center p-4">
        <h3 className="text-lg font-bold text-white">{character.name}</h3>
        <div className="mt-2 text-sm text-white">
          <p>Guild: {character.guild_info?.guild_name || "-"}</p>
          <p>Class: {character.class_name}</p>
          <p>Level: {character.level}</p>
          <p>Race: {character.race}</p>
          <p>Realm: {getRealmNameAndColor(character.realm).name}</p>
          <p>Realm Rank: {realmRank}</p>
          <div className="w-full my-2">
            <LinearProgress variant="determinate" value={progressPercentage} />
          </div>
          <div className="text-center text-xs">
            {progressPercentage.toFixed(2)}% to next rank
          </div>
        </div>
      </div>
    </TableCell>
  );
};

export default MobileCharacterDetails;
