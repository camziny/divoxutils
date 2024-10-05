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
        onClick={() => setOpen(!open)}
        className={`rounded-xl overflow-hidden shadow-md bg-gray-800 ${realm.color}`}
        sx={{
          padding: 0,
          margin: 0,
          height: "24px",
          "&:last-child td, &:last-child th": { border: 0 },
          "& td, & th": { borderBottom: "none" },
        }}
        hover={false}
        style={{ cursor: "pointer", width: "100%" }}
      >
        <TableCell sx={{ width: "5%", padding: "2px", height: "24px" }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            sx={{
              padding: "2px",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "transparent",
              },
            }}
          >
            {open ? (
              <ExpandLessIcon className="text-white text-xs" />
            ) : (
              <ExpandMoreIcon className="text-white text-xs" />
            )}
          </IconButton>
        </TableCell>
        <TableCell
          sx={{
            width: "20%",
            padding: "2px",
            height: "24px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          className="!text-white text-xs font-semibold truncate"
        >
          {characterDetails.heraldName}
        </TableCell>
        <TableCell
          sx={{ width: "12%", padding: "2px", height: "24px" }}
          className="!text-white text-xs font-semibold"
        >
          <div className="truncate">{characterDetails.heraldClassName}</div>
        </TableCell>
        <TableCell
          sx={{ width: "12%", padding: "2px", height: "24px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.formattedHeraldRealmPoints || "-"}
        </TableCell>
        <TableCell
          sx={{ width: "18%", padding: "2px", height: "24px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.heraldGuildName || "-"}
        </TableCell>
        <TableCell
          sx={{ width: "8%", padding: "2px", height: "24px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.heraldLevel}
        </TableCell>
        <TableCell
          sx={{ width: "10%", padding: "2px", height: "24px" }}
          className="!text-white text-xs font-semibold hidden lg:table-cell"
        >
          {characterDetails.heraldRace}
        </TableCell>
        <TableCell
          sx={{ width: "10%", padding: "2px", height: "24px" }}
          className="!text-white text-xs font-semibold"
        >
          {realm.name}
        </TableCell>
        <TableCell
          sx={{ width: "5%", padding: "2px", height: "24px" }}
          className="p-0 text-center"
        >
          {showDeleteIcon && isOwner && (
            <IconButton
              size="medium"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  onDelete();
                }
              }}
              sx={{
                padding: "2px",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <DeleteIcon style={{ fontSize: 12 }} className="text-white" />
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
