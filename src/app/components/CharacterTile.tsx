"use client";
import React, { useEffect, useState } from "react";
import { TableRow, TableCell, IconButton, Grow } from "@mui/material";
import ExpandCircleDownIcon from "@mui/icons-material/ExpandCircleDown";
import CharacterDetails from "./CharacterDetails";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Snackbar } from "@mui/material";
import CharacterTileSkeleton from "./CharacterTileSkeleton";

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
const getRealmNameAndColor = (realmName: string) => {
  switch (realmName) {
    case "Albion":
      return { name: "Albion", color: "albion" };
    case "Midgard":
      return { name: "Midgard", color: "midgard" };
    case "Hibernia":
      return { name: "Hibernia", color: "hibernia" };
    default:
      return { name: "", color: "" };
  }
};

const realmsSummary = {
  Albion: { kills: 0, deathblows: 0, soloKills: 0, deaths: 0, realmPoints: 0 },
  Midgard: { kills: 0, deathblows: 0, soloKills: 0, deaths: 0, realmPoints: 0 },
  Hibernia: {
    kills: 0,
    deathblows: 0,
    soloKills: 0,
    deaths: 0,
    realmPoints: 0,
  },
  Total: { kills: 0, deathblows: 0, soloKills: 0, deaths: 0, realmPoints: 0 },
};

const CharacterTile: React.FC<{
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
  character,
  characterDetails,
  webId,
  initialCharacter,
  realmPointsLastWeek,
  totalRealmPoints,
  currentUserId,
  ownerId,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const isOwner = userId === ownerId;

  const showDeleteIcon = isOwner;

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
      router.refresh();
      setSnackbarMessage(data.message);
      setSnackbarOpen(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in handleDelete:", error);
        setSnackbarMessage(error.message);
        setSnackbarOpen(true);
      }
    }
  };

  const getOpponentRealms = (realmName: string) => {
    const realms = ["Albion", "Midgard", "Hibernia"];
    return realms.filter((r) => r !== realmName);
  };

  if (!characterDetails) return <CharacterTileSkeleton />;

  const realm = getRealmNameAndColor(character.realm);

  const opponentRealms = getOpponentRealms(character.realm);

  const firstOpponentStats = characterDetails.player_kills[opponentRealms[0]];
  const secondOpponentStats = characterDetails.player_kills[opponentRealms[1]];

  const realmPointsThisWeek = characterDetails.realm_points - totalRealmPoints;

  return (
    <>
      <TableRow
        className={`rounded-xl overflow-hidden shadow-md bg-gray-800 ${realm.color}`}
      >
        <TableCell className="w-1/12 px-4">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? (
              <ExpandCircleDownIcon className="text-white text-base" />
            ) : (
              <ExpandCircleDownIcon className="text-white text-base" />
            )}
          </IconButton>
        </TableCell>
        <TableCell className="w-1/4 px-6 text-white text-sm font-semibold">
          {characterDetails.name}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold">
          <div className="max-w-xs truncate">{characterDetails.class_name}</div>
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-md font-semibold">
          {characterDetails.formattedRealmPoints || "-"}
        </TableCell>
        <TableCell className="w-1/4 px-6 text-white text-sm font-semibold">
          {characterDetails.guild_name || "-"}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold">
          {characterDetails.level}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold hidden lg:table-cell">
          {characterDetails.race}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold">
          {realm.name}
        </TableCell>
        <TableCell className="w-1/12 px-4">
          {showDeleteIcon && isOwner && (
            <IconButton
              size="large"
              onClick={(e) => handleDelete(e, character.webId)}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <DeleteIcon style={{ fontSize: 16 }} className="text-white" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-gray-900">
          <TableCell colSpan={9} className="p-0">
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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default CharacterTile;
