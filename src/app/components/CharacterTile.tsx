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
import { Tooltip, TooltipProps } from "@mui/material";
import { styled } from "@mui/material/styles";

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
    webId: string | null;
  };
  webId: string | null;
  realmPointsLastWeek: number;
  totalRealmPoints: number;
  currentUserId: string;
  ownerId: string;
  formattedHeraldRealmPoints: any;
  heraldBountyPoints: any;
  heraldTotalKills: any;
  heraldTotalDeaths: any;
  heraldServerName: string;
  onDelete?: () => void;
  showDelete?: boolean;
  isDeleting?: boolean;
}> = ({
  character,
  characterDetails,
  initialCharacter,
  realmPointsLastWeek,
  totalRealmPoints,
  ownerId,
  onDelete,
  showDelete = true,
  isDeleting = false,
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

  const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))({
    [`& .MuiTooltip-tooltip`]: {
      backgroundColor: "#1a1a1a",
      color: "#ffffff",
      fontSize: "0.875rem",
      borderRadius: "4px",
      padding: "8px",
    },
  });

  return (
    <>
      <TableRow
        onClick={() => setOpen(!open)}
        className={`
          cursor-pointer
          ${getRealmGradientClass(realm.name)}
          border-l-4 ${getRealmBorderColor(realm.name)}
        `}
        sx={{
          padding: 0,
          margin: 0,
          height: "28px",
          "&:last-child td, &:last-child th": { border: 0 },
          "& td, & th": { 
            borderBottom: "none",
            padding: "2px 4px",
          }
        }}
        hover={false}
        style={{ cursor: "pointer", width: "100%" }}
      >
        <TableCell sx={{ width: "5%", padding: "2px", height: "20px" }}>
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
            height: "20px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          className="!text-white text-xs font-semibold truncate"
        >
          <CustomTooltip title={characterDetails.heraldName} arrow>
            <span>{characterDetails.heraldName}</span>
          </CustomTooltip>
        </TableCell>
        <TableCell
          sx={{ width: "12%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold"
        >
          <div className="truncate">{characterDetails.heraldClassName}</div>
        </TableCell>
        <TableCell
          sx={{ width: "12%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.formattedHeraldRealmPoints || "-"}
        </TableCell>
        <TableCell
          sx={{ width: "18%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.heraldGuildName || "-"}
        </TableCell>
        <TableCell
          sx={{ width: "8%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.heraldLevel}
        </TableCell>
        <TableCell
          sx={{ width: "10%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold hidden lg:table-cell"
        >
          {characterDetails.heraldRace}
        </TableCell>
        <TableCell
          sx={{ width: "10%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold"
        >
          {realm.name}
        </TableCell>
        <TableCell
          sx={{ width: "10%", padding: "2px", height: "20px" }}
          className="!text-white text-xs font-semibold"
        >
          {characterDetails.heraldServerName}
        </TableCell>
        <TableCell
          sx={{ width: "5%", padding: "2px", height: "20px" }}
          className="p-0 text-center"
        >
          {showDeleteIcon && isOwner && (
            <IconButton
              size="medium"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete && !isDeleting) {
                  onDelete();
                }
              }}
              disabled={isDeleting}
              sx={{
                padding: "2px",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
                },
                "&:disabled": {
                  backgroundColor: "transparent",
                },
              }}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <DeleteIcon style={{ fontSize: 12 }} className="text-white hover:text-indigo-400 transition-colors" />
              )}
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      <AnimatePresence initial={false}>
        {open && (
          <TableRow className="bg-gray-900">
            <TableCell colSpan={10} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
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

const getRealmBorderColor = (realm: string) => {
  switch (realm) {
    case "Albion":
      return "border-red-600";
    case "Midgard":
      return "border-blue-600";
    case "Hibernia":
      return "border-green-600";
    default:
      return "border-gray-600";
  }
};

const getRealmGradientClass = (realm: string) => {
  switch (realm) {
    case "Albion":
      return "bg-gradient-to-r from-red-800/20 to-red-700/20";
    case "Midgard":
      return "bg-gradient-to-r from-blue-800/20 to-blue-700/20";
    case "Hibernia":
      return "bg-gradient-to-r from-green-800/20 to-green-700/20";
    default:
      return "bg-gray-800/20";
  }
};

export default CharacterTile;
