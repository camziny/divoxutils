"use client";
import React, { useState } from "react";
import { TableRow, TableCell, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CharacterDetails from "./CharacterDetails";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { currentUser, useAuth } from "@clerk/nextjs";
import { Snackbar } from "@mui/material";
import CharacterTileSkeleton from "./CharacterTileSkeleton";
import { CharacterData } from "@/utils/character";
import { motion, AnimatePresence } from "framer-motion";

type KillStats = {
  kills: number;
  deaths: number;
  death_blows: number;
  solo_kills: number;
};

type CharacterInfo = {
  character_web_id: string;
  name: string;
  realm: string;
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
  formattedHeraldRealmPoints: string;
  heraldBountyPoints: number;
  heraldTotalKills: number;
  heraldTotalDeaths: number;
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
  character: CharacterData;
  characterDetails: CharacterData;
  initialCharacter: {
    id: number;
    userId: string;
    webId: string;
  };
  webId: string;
  realmPointsLastWeek: number;
  totalRealmPoints: number;
  currentUserId: string;
  ownerId: string;
  formattedHeraldRealmPoints: any;
  heraldBountyPoints: any;
  heraldTotalKills: any;
  heraldTotalDeaths: any;
  onDelete?: () => void;
  showDelete?: boolean;
}> = ({
  character,
  characterDetails,
  initialCharacter,
  realmPointsLastWeek,
  totalRealmPoints,
  ownerId,
  onDelete,
  showDelete = true,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const isOwner = userId === ownerId;

  const showDeleteIcon = isOwner && showDelete;

  const getOpponentRealms = (realmName: string) => {
    const realms = ["Albion", "Midgard", "Hibernia"];
    return realms.filter((r) => r !== realmName);
  };

  if (!characterDetails) return <CharacterTileSkeleton />;

  const realm = getRealmNameAndColor(characterDetails.realm);

  const opponentRealms = getOpponentRealms(characterDetails.realm);

  const realmPointsThisWeek =
    characterDetails.heraldRealmPoints - totalRealmPoints;

  return (
    <>
      <TableRow
        className={`rounded-xl overflow-hidden shadow-md bg-gray-800 ${realm.color}`}
      >
        <TableCell
          sx={{
            padding: "4px",
            minHeight: "24px",
            maxHeight: "24px",
            height: "24px",
          }}
          className="w-1/12"
        >
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? (
              <ExpandLessIcon className="text-white text-base" />
            ) : (
              <ExpandMoreIcon className="text-white text-base" />
            )}
          </IconButton>
        </TableCell>
        <TableCell className="w-1/4 px-6 text-white text-sm font-semibold !text-white">
          {characterDetails.heraldName}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold !text-white">
          <div className="max-w-xs truncate">
            {characterDetails.heraldClassName}
          </div>
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-md font-semibold !text-white">
          {characterDetails.formattedHeraldRealmPoints || "-"}
        </TableCell>
        <TableCell className="w-1/4 px-6 text-white text-sm font-semibold !text-white">
          {characterDetails.heraldGuildName || "-"}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold !text-white">
          {characterDetails.heraldLevel}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold hidden lg:table-cell !text-white">
          {characterDetails.heraldRace}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold !text-white">
          {realm.name}
        </TableCell>
        <TableCell className="w-1/12 px-4">
          {showDeleteIcon && isOwner && (
            <IconButton size="small" onClick={onDelete}>
              <DeleteIcon style={{ fontSize: 16 }} className="text-white" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      <AnimatePresence initial={false}>
        {open && (
          <TableRow className="bg-gray-900">
            <TableCell colSpan={9} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex justify-center py-2">
                  <CharacterDetails
                    character={characterDetails}
                    opponentRealms={opponentRealms}
                    realmPointsLastWeek={realmPointsLastWeek}
                    realmPointsThisWeek={realmPointsThisWeek}
                    totalRealmPoints={totalRealmPoints}
                  />
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
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
