import React from "react";
import { TableCell } from "@mui/material";
import {
  CharacterInfo,
  getRealmNameAndColor,
  getRealmRankForPoints,
  formatRealmRankWithLevel,
} from "@/utils/character";

type MobileCharacterDetailsProps = {
  character: CharacterInfo;
};

const MobileCharacterDetails: React.FC<MobileCharacterDetailsProps> = ({
  character,
}) => {
  const realmPoints = character.realm_war_stats?.current?.realm_points;
  const realmRank = formatRealmRankWithLevel(
    getRealmRankForPoints(realmPoints)
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
        </div>
      </div>
    </TableCell>
  );
};

export default MobileCharacterDetails;
