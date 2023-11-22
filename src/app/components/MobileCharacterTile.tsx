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
  realm_war_stats: {
    current: {
      realm_points: number;
      player_kills: {
        total: KillStats;
        [key: string]: KillStats;
      };
    };
  };
};

const MobileCharacterTile: React.FC<{
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
  currentUserId: string;
  ownerId: string;
}> = ({ webId, initialCharacter, currentUserId, ownerId }) => {
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();

  const isOwner = userId === ownerId;
  const showDeleteIcon = isOwner;
  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        `https://api.camelotherald.com/character/info/${webId}`
      );
      const data = await response.json();
      setCharacter(data);
    }

    fetchData();
  }, [webId]);

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

  const getOpponentRealms = (realmId: number) => {
    const realms = ["albion", "midgard", "hibernia"];
    const currentRealm = realms[realmId - 1];
    return realms.filter((r) => r !== currentRealm);
  };

  if (!character) return <MobileCharacterTileSkeleton />;

  const realm = getRealmNameAndColor(character.realm);
  const opponentRealms = getOpponentRealms(character.realm);

  const firstOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[0]];
  const secondOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[1]];

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength - 3)}...`
      : text;
  };

  return (
    <>
      <TableRow
        className={`rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-800 ${realm.color}`}
      >
        <TableCell className="p-0.5 w-8">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? (
              <ExpandCircleDownIcon className="text-white text-xxs" />
            ) : (
              <ExpandCircleDownIcon className="text-white text-xxs" />
            )}
          </IconButton>
        </TableCell>
        <TableCell className="text-white text-xxs sm:text-xs font-semibold p-0.5 truncate w-1/4">
          {truncateText(character.name, 10)}
        </TableCell>
        <TableCell className="text-white text-xxs sm:text-xs font-semibold p-0.5 truncate w-1/4">
          {truncateText(character.class_name, 8)}
        </TableCell>
        <TableCell className="text-white text-xxs sm:text-xs font-semibold p-0.5 truncate w-1/4">
          {character.realm_war_stats?.current?.realm_points
            ? formatRealmRankWithLevel(
                getRealmRankForPoints(
                  character.realm_war_stats.current.realm_points
                )
              )
            : "-"}
        </TableCell>
        <TableCell className="p-0.5 w-8">
          {showDeleteIcon && isOwner && (
            <IconButton
              size="small"
              onClick={(e) => handleDelete(e, character.character_web_id)}
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
                character={character}
                opponentRealms={opponentRealms}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default MobileCharacterTile;
