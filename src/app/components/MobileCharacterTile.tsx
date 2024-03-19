"use client";
import React, { useEffect, useState } from "react";
import { TableRow, TableCell, IconButton } from "@mui/material";
import ExpandCircleDownIcon from "@mui/icons-material/ExpandCircleDown";
import CharacterDetails from "./CharacterDetails";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  getRealmNameAndColor,
  getRealmRanks,
  getRealmRankForPoints,
  formatRealmRankWithLevel,
} from "@/utils/character";
import { useMediaQuery } from "react-responsive";
import MobileCharacterTileSkeleton from "./MobileCharacterTileSkeleton";

type KillStats = {
  kills: number;
  deaths: number;
  death_blows: number;
  solo_kills: number;
};

type CharacterInfo = {
  character_web_id: string;
  name: string;
  realm: number;
  race: string;
  class_name: string;
  level: number;
  guild_info?: {
    guild_name?: string;
  };
  formattedRealmPoints: string;
  guild_name: string;
  realm_points: number;
  player_kills: {
    total: KillStats;
    [key: string]: KillStats;
  };
};

const MobileCharacterTile: React.FC<{
  character: {
    id: number;
    webId: string;
    characterName: string;
    className: string;
    realm: string;
  };
  characterDetails: CharacterInfo;
  webId: string;
  initialCharacter: {
    character: {
      id: number;
      webId: string;
    };
    user: {
      id: number;
      clerkUserId: string;
      email: string;
      name: string;
      accountId: number | null;
    };
  };
  realmPointsLastWeek: number;
  totalRealmPoints: number;
  currentUserId: string;
  ownerId: string;
}> = ({
  webId,
  character,
  characterDetails,
  initialCharacter,
  realmPointsLastWeek,
  totalRealmPoints,
  currentUserId,
  ownerId,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();

  const isOwner = userId === ownerId;
  const showDeleteIcon = isOwner;
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const handleDelete = async (
    event: React.MouseEvent,
    characterWebId: string
  ) => {
    event.stopPropagation();

    const characterId = initialCharacter.character.id;

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this character?"
    );
    if (!isConfirmed) return;
    try {
      const response = await fetch(
        `/api/userCharacters/${userId}/${characterId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      alert(data.message);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in handleDelete:", error);
        alert(error.message);
      }
    }
  };

  const getOpponentRealms = (realmName: string) => {
    const realms = ["Albion", "Midgard", "Hibernia"];
    return realms.filter((r) => r !== realmName);
  };

  if (!characterDetails) return <MobileCharacterTileSkeleton />;

  const realm = getRealmNameAndColor(character.realm);
  const opponentRealms = getOpponentRealms(character.realm);

  const firstOpponentStats = characterDetails.player_kills[opponentRealms[0]];
  const secondOpponentStats = characterDetails.player_kills[opponentRealms[1]];

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength - 3)}...`
      : text;
  };

  const realmPointsThisWeek = characterDetails.realm_points - totalRealmPoints;

  return (
    <>
      <TableRow
        className={`rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-800 ${realm.color}`}
      >
        <TableCell className="p-0.5 w-8">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? (
              <ExpandCircleDownIcon className="text-white text-xs" />
            ) : (
              <ExpandCircleDownIcon className="text-white text-xs" />
            )}
          </IconButton>
        </TableCell>
        <TableCell className="text-white text-xs sm:text-xs font-semibold p-0.5 truncate w-1/4">
          {truncateText(characterDetails.name, 10)}
        </TableCell>
        <TableCell className="text-white text-xs sm:text-xs font-semibold p-0.5 truncate w-1/4">
          {truncateText(characterDetails.class_name, 8)}
        </TableCell>
        <TableCell className="text-white text-xs sm:text-xs font-semibold p-0.5 truncate w-1/4">
          {characterDetails.formattedRealmPoints || "-"}
        </TableCell>
        <TableCell className="p-0.5 w-8">
          {showDeleteIcon && isOwner && (
            <IconButton
              size="small"
              onClick={(e) => handleDelete(e, character.webId)}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <DeleteIcon style={{ fontSize: 16 }} className="text-white" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-gray-700">
          <TableCell colSpan={isMobile ? 5 : 9} className="p-0">
            <div className="flex justify-center py-2">
              <CharacterDetails
                character={characterDetails}
                opponentRealms={opponentRealms}
                realmPointsLastWeek={realmPointsLastWeek}
                realmPointsThisWeek={realmPointsThisWeek}
                totalRealmPoints={totalRealmPoints}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default MobileCharacterTile;
