"use client";
import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandCircleDown";
import MobileCharacterDetails from "./MobileCharacterDetails";
import { getRealmRankForPoints, formatRealmRankWithLevel } from "@/utils/character";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import {
  getRealmNameAndColor,
} from "@/utils/character";
import MobileCharacterTileSkeleton from "./MobileCharacterTileSkeleton";
import { CharacterData } from "@/utils/character";
import { getRealmSurfaceInteractiveClass } from "./characterTileTheme";

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
  const detailsRegionId = `mobile-character-details-${character.id}`;

  const realmPointsThisWeek =
    characterDetails.heraldRealmPoints - totalRealmPoints;

  const formattedRank = formatRealmRankWithLevel(
    getRealmRankForPoints(characterDetails.heraldRealmPoints || 0)
  );

  return (
    <div className="mb-1 mx-3">
      <div
        className={`relative overflow-hidden rounded-md ${getRealmSurfaceInteractiveClass(realm.name)} cursor-pointer transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40`}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-controls={detailsRegionId}
      >
        <div className="flex items-center px-3 py-1.5">
          <div className="mr-2">
            <div className={`transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <ExpandMoreIcon 
                className="text-white/85" 
                style={{ fontSize: 18 }} 
                aria-hidden="true"
              />
            </div>
          </div>
          
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
                  <div className="text-white font-semibold text-sm">
                    {formattedRank || "0"}
                  </div>
                  <div className="text-gray-300 text-xs">
                    {characterDetails.heraldServerName || "Unknown"}
                  </div>
                </div>
                
                {showDeleteIcon && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDelete && !isDeleting) onDelete();
                    }}
                    disabled={isDeleting}
                    aria-label={`Delete ${character.heraldName}`}
                    data-testid={`delete-character-${character.id}`}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-300 transition-colors duration-150 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <X size={14} aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div id={detailsRegionId} className="mt-1 animate-in slide-in-from-top-2 duration-200">
          <MobileCharacterDetails
            character={characterDetails}
            opponentRealms={opponentRealms}
            realmPointsLastWeek={realmPointsLastWeek}
            realmPointsThisWeek={realmPointsThisWeek}
            totalRealmPoints={totalRealmPoints}
            compact
          />
        </div>
      )}
    </div>
  );
};

export default MobileCharacterTile;
