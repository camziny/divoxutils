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

  // Enhanced realm colors for better visibility
  const enhancedRealmColors = {
    'bg-red-500': 'bg-red-800',
    'bg-blue-500': 'bg-blue-800', 
    'bg-green-500': 'bg-green-800',
  };
  const realmColor = enhancedRealmColors[realm.color as keyof typeof enhancedRealmColors] || realm.color;

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
        className={`relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-gray-800 ${realmColor} cursor-pointer group`}
        onClick={() => setOpen(!open)}
      >
        <div className="bg-gradient-to-r from-gray-900/75 to-gray-900/60 backdrop-blur-sm">
          <div className="flex items-center px-3 py-1.5">
            {/* Expand/Collapse Button */}
            <div className="mr-2">
              <div className={`transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                <ExpandMoreIcon 
                  className="text-white/70 hover:text-white" 
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
                        if (onDelete) onDelete();
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-red-500/20"
                    >
                      <DeleteIcon className="text-red-400" style={{ fontSize: 16 }} />
                    </button>
                  )}
                </div>
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
