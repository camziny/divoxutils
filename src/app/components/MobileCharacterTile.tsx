"use client";
import React, { useEffect, useState } from "react";
import { TableRow, TableCell, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandCircleDown";
import ExpandLessIcon from "@mui/icons-material/ExpandCircleDown";
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
import { CharacterData } from "@/utils/character";

type KillStats = {
  kills: number;
  deaths: number;
  death_blows: number;
  solo_kills: number;
};

const MobileCharacterTile: React.FC<{
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
  showDelete?: boolean;
  onDelete?: () => void;
}> = ({
  webId,
  character,
  characterDetails,
  initialCharacter,
  realmPointsLastWeek,
  totalRealmPoints,
  currentUserId,
  ownerId,
  onDelete,
  showDelete = true,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();

  const isOwner = userId === ownerId;
  const showDeleteIcon = isOwner && showDelete;
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const getOpponentRealms = (realmName: string) => {
    const realms = ["Albion", "Midgard", "Hibernia"];
    return realms.filter((r) => r !== realmName);
  };

  if (!characterDetails) return <MobileCharacterTileSkeleton />;

  const realm = getRealmNameAndColor(characterDetails.realm);
  const opponentRealms = getOpponentRealms(characterDetails.realm);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength - 3)}...`
      : text;
  };

  const realmPointsThisWeek =
    characterDetails.heraldRealmPoints - totalRealmPoints;

  return (
    <>
      <TableRow
        onClick={() => setOpen(!open)}
        className={`rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-800 ${realm.color}`}
        sx={{
          minHeight: "18px",
          maxHeight: "18px",
          height: "18px",
          "&:last-child td, &:last-child th": { border: 0 },
          "& td, & th": { borderBottom: "none" },
        }}
        style={{ cursor: "pointer" }}
      >
        <TableCell
          className="p-0.5 w-5"
          sx={{ padding: "2px", minHeight: "18px", maxHeight: "18px" }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? (
              <ExpandLessIcon className="text-white" style={{ fontSize: 14 }} />
            ) : (
              <ExpandMoreIcon className="text-white" style={{ fontSize: 14 }} />
            )}
          </IconButton>
        </TableCell>
        <TableCell
          className="text-white text-xs sm:text-xs font-semibold p-0.5 truncate"
          sx={{
            width: "40%",
            padding: "2px",
            minHeight: "18px",
            maxHeight: "18px",
          }}
        >
          {truncateText(characterDetails.heraldName, 15)}
        </TableCell>
        <TableCell
          className="text-white text-xs sm:text-xs font-semibold p-0.5 truncate"
          sx={{
            width: "25%",
            padding: "2px",
            minHeight: "18px",
            maxHeight: "18px",
          }}
        >
          {truncateText(characterDetails.heraldClassName, 8)}
        </TableCell>
        <TableCell
          className="text-white text-xs sm:text-xs font-semibold p-0.5 text-center"
          sx={{
            width: "25%",
            padding: "2px",
            minHeight: "18px",
            maxHeight: "18px",
          }}
        >
          {characterDetails.formattedHeraldRealmPoints || "-"}
        </TableCell>
        <TableCell
          className="p-0.5 w-5 text-center"
          sx={{ minHeight: "18px", maxHeight: "18px" }}
        >
          {showDeleteIcon && isOwner && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  onDelete();
                }
              }}
            >
              <DeleteIcon className="text-white" style={{ fontSize: 14 }} />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="bg-gray-900">
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
