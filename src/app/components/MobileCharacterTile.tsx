"use client";
import React, { useState } from "react";
import { IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandCircleDown";
import ExpandLessIcon from "@mui/icons-material/ExpandCircleDown";
import MobileCharacterDetails from "./MobileCharacterDetails";
import { getRealmRankForPoints, formatRealmRankWithLevel } from "@/utils/character";
import { X, Loader2 } from "lucide-react";
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
  const getRealmColorClass = (realmName: string) => {
    switch (realmName) {
      case "Albion":
        return "bg-red-900/20";
      case "Midgard":
        return "bg-blue-900/20";
      case "Hibernia":
        return "bg-green-900/20";
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

  const formattedRank = formatRealmRankWithLevel(
    getRealmRankForPoints(characterDetails.heraldRealmPoints || 0)
  );

  return (
    <div className="mb-1 mx-3">
      <div
        className={`relative overflow-hidden rounded-md border border-gray-800 ${getRealmColorClass(realm.name)} cursor-pointer`}
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
                <p className="text-gray-400 text-xs">
                  {characterDetails.heraldClassName || "Unknown"}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-white font-semibold text-sm">
                    {formattedRank || "0"}
                  </div>
                  <div className="text-gray-400 text-xs">
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
                    data-testid={`delete-character-${character.id}`}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 transition-colors duration-150 disabled:opacity-40"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
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
