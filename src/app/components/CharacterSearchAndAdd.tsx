"use client";
import React, { useState, useEffect, useTransition } from "react";
import { Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import InfoIcon from "@mui/icons-material/Info";
import { Tooltip } from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import useDebounce from "./UseDebounce";
import {
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CharacterSearchAndAddTooltip from "./CharacterSearchAndAddTooltip";

type CharacterType = {
  character_web_id: string;
  name: string;
  level: number;
  class_name: string;
  guild_info?: {
    guild_name: string;
  };
  realm_points: number;
  heraldCharacterWebId: string;
  heraldName: string;
  heraldServerName: string;
  heraldRealm: number;
  heraldRace: string;
  heraldClassName: string;
  heraldLevel: number;
  heraldGuildName: string;
  heraldRealmPoints: number;
  heraldBountyPoints: number;
  heraldTotalKills: number;
  heraldTotalDeaths: number;
  heraldTotalDeathBlows: number;
  heraldTotalSoloKills: number;
  heraldMidgardKills: number;
  heraldMidgardDeaths: number;
  heraldMidgardDeathBlows: number;
  heraldMidgardSoloKills: number;
  heraldAlbionKills: number;
  heraldAlbionDeaths: number;
  heraldAlbionDeathBlows: number;
  heraldAlbionSoloKills: number;
  heraldHiberniaKills: number;
  heraldHiberniaDeaths: number;
  heraldHiberniaDeathBlows: number;
  heraldHiberniaSoloKills: number;
  heraldMasterLevel: string;
};

type UserType = {
  sessionToken: string;
};

type RealmNames = {
  [key: number]: string;
};

const getRealmName = (realmId: number): string => {
  const realmNames: RealmNames = {
    1: "Albion",
    2: "Midgard",
    3: "Hibernia",
  };
  return realmNames[realmId] || "Unknown";
};

function CharacterSearchAndAdd() {
  const { userId } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const [name, setName] = useState("");
  const [cluster, setCluster] = useState("ywain");
  const [searchResults, setSearchResults] = useState<CharacterType[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterType[]>(
    []
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [addedCount, setAddedCount] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [charactersAdded, setCharactersAdded] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [invalidSearchAttempted, setInvalidSearchAttempted] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(name, 500);

  const handleTooltipToggle = () => {
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchCharacters = async (name: string, cluster: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?name=${name}&cluster=${cluster}`,
      {}
    );
    return response.json();
  };

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.length < 3) {
        setInvalidSearchAttempted(debouncedSearchTerm.length > 0);
        setSearchResults([]);
        return;
      }
      setInvalidSearchAttempted(false);
      setHasSearched(true);
      setIsFetching(true);
      try {
        const results = await fetchCharacters(debouncedSearchTerm, cluster);
        if (results && results.results) {
          setSearchResults(results.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching characters:", error);
      } finally {
        setIsFetching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, cluster]);

  const saveCharacters = async () => {
    setIsFetching(true);
    const webIds = selectedCharacters.map(
      (character) => character.character_web_id
    );

    try {
      const response = await fetch("/api/characters/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webIds }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add character");
      }

      router.refresh();
      setSnackbarOpen(true);
      setAddedCount(selectedCharacters.length);
      setSelectedCharacters([]);
      setCharactersAdded(true);
    } catch (error) {
      console.error("Error saving characters:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddToList = async () => {
    const numSelected = selectedCharacters.length;
    try {
      await saveCharacters();
      setIsFetching(false);
      setAddedCount(numSelected);
      setSnackbarOpen(true);
      setSelectedCharacters([]);
      setSearchResults([]);
      setName("");
      setHasSearched(false);
      setInvalidSearchAttempted(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to add to list:", error);
    }
  };

  const handleSnackbarClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
    setAddedCount(0);
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

  const getRealmRankForPoints = (points: number) => {
    let rank = 0;
    for (const [rr, requiredPoints] of realmRanksMap) {
      if (points >= requiredPoints) {
        rank = rr;
      } else {
        break;
      }
    }
    return rank;
  };

  const formatRealmRankWithLevel = (rank: number) => {
    const rankString = rank.toString();
    return `${rankString.slice(0, -1)}L${rankString.slice(-1)}`;
  };

  const cancelSearch = () => {
    setSearchResults([]);
    setName("");
    setCluster("ywain");
    setSelectedCharacters([]);
    setHasSearched(false);
    setIsFetching(false);
  };

  function handleServerChange(server: string) {
    setCluster(server);
  }

  const servers = {
    ywain: "Ywain",
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between mb-2">
        <CharacterSearchAndAddTooltip />
      </div>
      <div className="flex flex-wrap items-center mb-2 space-x-2">
        <div className="relative flex-1">
          <Input
            size="sm"
            type="text"
            placeholder="Character Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            classNames={{
              label: "text-gray-500 dark:text-gray-300",
              input: [
                "bg-transparent",
                "text-gray-800 dark:text-gray-200",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              ],
              innerWrapper: "bg-transparent",
              inputWrapper: [
                "shadow-xl",
                "bg-gray-800",
                "dark:bg-gray-700",
                "hover:bg-gray-700 dark:hover:bg-gray-600",
                "group-data-[focused=true]:bg-gray-800 dark:group-data-[focused=true]:bg-gray-700",
                "focus:border-indigo-600",
                "!cursor-text",
              ],
            }}
          />
        </div>
        <div>
          <Dropdown>
            <DropdownTrigger>
              <Button
                color="primary"
                className="text-indigo-500 bg-gray-800 border-indigo-500"
              >
                {servers[cluster as keyof typeof servers] ||
                  "Select a Cluster..."}
                <KeyboardArrowDownIcon />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              variant="faded"
              aria-label="Server Selection"
              className="bg-gray-900 text-indigo-400"
            >
              {Object.entries(servers).map(([key, label]) => (
                <DropdownItem
                  key={key}
                  onClick={() => handleServerChange(key)}
                  className="hover:bg-gray-700"
                >
                  {label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      {isFetching && (
        <div className="mt-4 flex justify-center">
          <CircularProgress className="text-indigo-500" />
        </div>
      )}
      {invalidSearchAttempted && (
        <div className="mt-4 text-white text-center">
          Please enter at least 3 characters to perform a search
        </div>
      )}
      {!isFetching &&
        hasSearched &&
        name.length >= 3 &&
        searchResults.length === 0 &&
        !charactersAdded && (
          <div className="mt-4 text-white text-center">No Results Found</div>
        )}
      {hasSearched && searchResults.length > 0 && (
        <div className="p-2">
          <h2 className="text-lg font-bold mb-4">Select Characters to Add</h2>
          <ul>
            {searchResults.map((character) => {
              const realmRankPoints = character.realm_points;
              const realmRank = getRealmRankForPoints(realmRankPoints);
              const formattedRealmRank = formatRealmRankWithLevel(realmRank);
              const isSelected = selectedCharacters.some(
                (char) => char.character_web_id === character.character_web_id
              );
              const itemClass = isSelected
                ? "mb-2 bg-indigo-900/70 p-2 rounded-md text-white"
                : "mb-2 bg-gray-800 p-2 rounded-md text-gray-300";
              const toggleCharacterSelection = () => {
                setSelectedCharacters((prevSelected) => {
                  if (isSelected) {
                    return prevSelected.filter(
                      (char) =>
                        char.character_web_id !== character.character_web_id
                    );
                  } else {
                    return [...prevSelected, character];
                  }
                });
              };
              return (
                <li key={character.character_web_id} className={itemClass}>
                  <div
                    className="flex flex-col sm:flex-row items-start sm:items-center cursor-pointer"
                    onClick={toggleCharacterSelection}
                  >
                    <div className="flex items-center w-full">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={toggleCharacterSelection}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2"
                      />
                      <div className="flex-grow">
                        <span className="text-white block truncate">
                          {character.name}
                        </span>
                        <span className="text-gray-500 text-xs block truncate">
                          Lvl {character.level} {character.class_name}
                        </span>
                      </div>
                      <span className="text-indigo-500 text-xs sm:text-sm ml-auto">
                        RR: {formattedRealmRank}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm w-full mt-1 sm:mt-0 sm:ml-2">
                      Guild: {character.guild_info?.guild_name || "N/A"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="flex justify-center mt-4 space-x-4">
          <button
            disabled={selectedCharacters.length === 0}
            onClick={handleAddToList}
            className={`flex items-center space-x-2 text-md font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ${
              selectedCharacters.length === 0
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "bg-indigo-400 hover:bg-indigo-500 text-white"
            }`}
          >
            <AddCircleOutlinedIcon />
            <span>Add</span>
          </button>
          <button
            onClick={cancelSearch}
            className="flex items-center space-x-2 text-md font-semibold bg-red-400 text-white py-2 px-4 rounded-lg hover:bg-red-500 shadow-md transition-all duration-300"
          >
            <CancelOutlinedIcon />
            <span>Cancel</span>
          </button>
        </div>
      )}
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={`Successfully added ${
          addedCount === 1 ? "1 character" : `${addedCount} characters`
        }!`}
        action={
          <button
            onClick={() => setSnackbarOpen(false)}
            className="text-gray-300 hover:text-gray-500"
          >
            X
          </button>
        }
      />
    </div>
  );
}

export default CharacterSearchAndAdd;
