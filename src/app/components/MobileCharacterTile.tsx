"use client";
import React, { useState } from "react";
import { IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandCircleDown";
import ExpandLessIcon from "@mui/icons-material/ExpandCircleDown";
import MobileCharacterDetails from "./MobileCharacterDetails";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "@clerk/nextjs";
import {
  getRealmNameAndColor,
} from "@/utils/character";
import MobileCharacterTileSkeleton from "./MobileCharacterTileSkeleton";
import { CharacterData } from "@/utils/character";

interface MobileCharacterTileProps {
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
  showDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const MobileCharacterTile: React.FC<MobileCharacterTileProps> = ({
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
  isDeleting = false,
}) => {
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();

  const isOwner = userId === ownerId;
  const showDeleteIcon = isOwner && showDelete;

  const getOpponentRealms = (realmName: string) => {
    const realms = ["Albion", "Midgard", "Hibernia"];
    return realms.filter((r) => r !== realmName);
  };

  if (!characterDetails) return <MobileCharacterTileSkeleton />;

  const realm = getRealmNameAndColor(characterDetails.realm);
  const opponentRealms = getOpponentRealms(characterDetails.realm);

  // Match CharacterTile colors exactly
  const getRealmGradientClass = (realmName: string) => {
    switch (realmName) {
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

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength - 3)}...`
      : text;
  };

  const realmPointsThisWeek =
    characterDetails.heraldRealmPoints - totalRealmPoints;

  return (
    <div className="mb-1 mx-3">
      <div
        className={`relative overflow-hidden rounded-lg shadow-sm ${getRealmGradientClass(realm.name)} cursor-pointer`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center px-3 py-1.5">
          {/* Expand/Collapse Button */}
          <div className="mr-2">
            <div className={`transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <ExpandMoreIcon 
                className="text-white/70" 
                style={{ fontSize: 18 }} 
              />
            </div>
          </div>
          
          {/* Character Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-white font-medium text-sm leading-tight truncate">
                  {characterDetails.heraldName || "Unknown"}
                </h4>
                <p className="text-gray-300 text-xs">
                  {characterDetails.heraldClassName || "Unknown"}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-white font-bold text-sm">
                    {characterDetails.formattedHeraldRealmPoints || "0"}
                  </div>
                  <div className="text-gray-300 text-xs">
                    {characterDetails.heraldServerName || "Unknown"}
                  </div>
                </div>
                
                {showDeleteIcon && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDelete && !isDeleting) onDelete();
                    }}
                    disabled={isDeleting}
                    className="p-1 rounded-md disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <DeleteIcon className="text-red-400 hover:text-red-300" style={{ fontSize: 16 }} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-1 animate-in slide-in-from-top-2 duration-200">
          <MobileCharacterDetails
            character={characterDetails}
            opponentRealms={opponentRealms}
            realmPointsLastWeek={realmPointsLastWeek}
            realmPointsThisWeek={realmPointsThisWeek}
            totalRealmPoints={totalRealmPoints}
          />
        </div>
      )}
    </div>
  );
};

export default MobileCharacterTile;
