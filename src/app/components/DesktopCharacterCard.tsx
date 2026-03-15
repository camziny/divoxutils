"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CharacterData, formatRealmRankWithLevel, getRealmNameAndColor, getRealmRankForPoints } from "@/utils/character";
import MobileCharacterDetails from "./MobileCharacterDetails";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface DesktopCharacterCardProps {
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
}

const getRealmBg = (realmName: string) => {
  switch (realmName) {
    case "Albion": return "bg-red-900/10 hover:bg-red-900/20";
    case "Midgard": return "bg-blue-900/10 hover:bg-blue-900/20";
    case "Hibernia": return "bg-green-900/10 hover:bg-green-900/20";
    default: return "bg-gray-800/10 hover:bg-gray-800/20";
  }
};

const getOpponentRealms = (realmName: string) => {
  const realms = ["Albion", "Midgard", "Hibernia"];
  return realms.filter((r) => r !== realmName);
};

const DesktopCharacterCard: React.FC<DesktopCharacterCardProps> = ({
  character,
  characterDetails,
  realmPointsLastWeek,
  totalRealmPoints,
  ownerId,
  onDelete,
  showDelete = true,
  isDeleting = false,
}) => {
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const isOwner = userId === ownerId;
  const showDeleteIcon = isOwner && showDelete;

  const realm = getRealmNameAndColor(characterDetails.realm);
  const formattedRank = formatRealmRankWithLevel(
    getRealmRankForPoints(characterDetails.heraldRealmPoints || 0)
  );
  const realmPointsThisWeek =
    characterDetails.heraldRealmPoints - totalRealmPoints;
  const opponentRealms = getOpponentRealms(characterDetails.realm);

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center ${getRealmBg(realm.name)} transition-colors duration-100 rounded px-2 py-[3px] gap-1.5 group [@media(min-height:900px)]:px-2.5 [@media(min-height:900px)]:py-1 [@media(min-height:900px)]:gap-2`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate text-[11px] font-medium text-white min-w-0 flex-1 [@media(min-height:900px)]:text-xs">
          {characterDetails.heraldName || "Unknown"}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0 w-[70px] truncate [@media(min-height:900px)]:text-[11px] [@media(min-height:900px)]:w-[84px]">
          {characterDetails.heraldClassName || "-"}
        </span>
        <span className="text-[10px] font-semibold text-gray-300 flex-shrink-0 w-[32px] text-right [@media(min-height:900px)]:text-[11px] [@media(min-height:900px)]:w-[38px]">
          {formattedRank || "-"}
        </span>
        {showDeleteIcon && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete && !isDeleting) onDelete();
            }}
            disabled={isDeleting}
            data-testid={`delete-character-${character.id}`}
            className="p-0.5 rounded text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 disabled:opacity-40 flex-shrink-0 [@media(min-height:900px)]:p-1"
          >
            {isDeleting ? <Loader2 size={10} className="animate-spin [@media(min-height:900px)]:w-[11px] [@media(min-height:900px)]:h-[11px]" /> : <X size={10} className="[@media(min-height:900px)]:w-[11px] [@media(min-height:900px)]:h-[11px]" />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <MobileCharacterDetails
              character={characterDetails}
              opponentRealms={opponentRealms}
              realmPointsLastWeek={realmPointsLastWeek}
              realmPointsThisWeek={realmPointsThisWeek}
              totalRealmPoints={totalRealmPoints}
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopCharacterCard;
