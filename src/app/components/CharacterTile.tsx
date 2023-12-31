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
  realm_war_stats: {
    current: {
      realm_points: number;
      player_kills: {
        total: KillStats;
        [key: string]: KillStats;
      };
    };
  };
};

const getRealmNameAndColor = (realmId: number) => {
  switch (realmId) {
    case 1:
      return { name: "Albion", color: "albion" };
    case 2:
      return { name: "Midgard", color: "midgard" };
    case 3:
      return { name: "Hibernia", color: "hibernia" };
    default:
      return { name: "", color: "" };
  }
};

function getRealmRanks(): Map<number, number> {
  const realmRanks = new Map<number, number>();

  for (let rr = 0; rr < 100; rr++) {
    realmRanks.set(
      rr + 11,
      (50 * Math.pow(rr, 3) + 75 * Math.pow(rr, 2) + 25 * rr) / 6
    );
  }

  const hardcodedRanks: [number, number][] = [
    [111, 9111713],
    [112, 10114001],
    [113, 11226541],
    [114, 12461460],
    [115, 13832221],
    [116, 15353765],
    [117, 17042680],
    [118, 18917374],
    [119, 20998286],
    [120, 23308097],
    [121, 25871988],
    [122, 28717906],
    [123, 31876876],
    [124, 35383333],
    [125, 39275499],
    [126, 43595804],
    [127, 48391343],
    [128, 53714390],
    [129, 59622973],
    [130, 66181501],
    [131, 73461466],
    [132, 81542227],
    [133, 90511872],
    [134, 100468178],
    [135, 111519678],
    [136, 123786843],
    [137, 137403395],
    [138, 152517769],
    [139, 169294723],
    [140, 187917143],
  ];

  for (const [rank, points] of hardcodedRanks) {
    realmRanks.set(rank, points);
  }

  return realmRanks;
}
const realmRanksMap: any = getRealmRanks();

function getRealmRankForPoints(points: number): number {
  let rank = 0;

  for (const [rr, requiredPoints] of realmRanksMap) {
    if (points >= requiredPoints) {
      rank = rr;
    } else {
      break;
    }
  }

  return rank;
}

function formatRealmRankWithLevel(rank: number): string {
  const rankString = rank.toString();
  return `${rankString.slice(0, -1)}L${rankString.slice(-1)}`;
}

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
  currentUserId: string;
  ownerId: string;
}> = ({
  webId,
  initialCharacter,
  realmPointsLastWeek,
  currentUserId,
  ownerId,
}) => {
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const isOwner = userId === ownerId;

  const showDeleteIcon = isOwner;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `https://api.camelotherald.com/character/info/${webId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch character data for webId: ${webId}`);
        }
        const data = await response.json();
        setCharacter(data);
      } catch (error) {
        console.error(
          `Error fetching character data for webId ${webId}:`,
          error
        );
      }
    }

    fetchData();
  }, [webId]);

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

  const getOpponentRealms = (realmId: number) => {
    const realms = ["albion", "midgard", "hibernia"];
    const currentRealm = realms[realmId - 1];
    return realms.filter((r) => r !== currentRealm);
  };

  if (!character) return <CharacterTileSkeleton />;

  const realm = getRealmNameAndColor(character.realm);
  const opponentRealms = getOpponentRealms(character.realm);

  const firstOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[0]];
  const secondOpponentStats =
    character.realm_war_stats?.current?.player_kills[opponentRealms[1]];

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
          {character.name}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold">
          <div className="max-w-xs truncate">{character.class_name}</div>
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-md font-semibold">
          {character.realm_war_stats?.current?.realm_points
            ? formatRealmRankWithLevel(
                getRealmRankForPoints(
                  character.realm_war_stats.current.realm_points
                )
              )
            : "-"}
        </TableCell>
        <TableCell className="w-1/4 px-6 text-white text-sm font-semibold">
          {character.guild_info?.guild_name || "-"}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold">
          {character.level}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold hidden lg:table-cell">
          {character.race}
        </TableCell>
        <TableCell className="w-1/6 px-6 text-white text-sm font-semibold">
          {realm.name}
        </TableCell>
        <TableCell className="w-1/12 px-4">
          {showDeleteIcon && isOwner && (
            <IconButton
              size="large"
              onClick={(e) => handleDelete(e, character.character_web_id)}
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
                character={character}
                opponentRealms={opponentRealms}
                realmPointsLastWeek={realmPointsLastWeek}
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
