"use client";
import React, { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { 
  Search, 
  Plus, 
  X, 
  Check, 
  Loader2, 
  Users, 
  AlertCircle,
  CheckSquare,
  Square
} from "lucide-react";
import useDebounce from "./UseDebounce";
import {
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Card,
  CardBody,
  Chip,
  Progress
} from "@nextui-org/react";
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

const CharacterItem = React.memo(({ 
  character, 
  isSelected, 
  onToggle,
  formattedRealmRank 
}: {
  character: CharacterType;
  isSelected: boolean;
  onToggle: (character: CharacterType) => void;
  formattedRealmRank: string;
}) => (
  <Card
    isPressable
    onPress={() => onToggle(character)}
    className={`
      mb-3 transition-all duration-200 cursor-pointer
      ${isSelected 
        ? 'bg-indigo-950/50 border-indigo-500/50 border-2' 
        : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/50 border'
      }
    `}
  >
    <CardBody className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-400" />
            ) : (
              <Square className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-medium truncate pr-2">
                {character.name}
              </h3>
              <Chip 
                size="sm" 
                variant="flat" 
                color="secondary"
                className="bg-indigo-500/20 text-indigo-300"
              >
                RR {formattedRealmRank}
              </Chip>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Lvl {character.level} {character.class_name}
              </span>
              <span className="text-gray-500 text-xs">
                {character.guild_info?.guild_name || "No Guild"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
));

CharacterItem.displayName = 'CharacterItem';

function CharacterSearchAndAdd() {
  const { userId } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [cluster, setCluster] = useState("ywain");
  const [searchResults, setSearchResults] = useState<CharacterType[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const debouncedSearchTerm = useDebounce(name, 300);

  const realmRanksMap = useMemo(() => {
    const realmRanks = new Map<number, number>();
    for (let rr = 0; rr < 100; rr++) {
      realmRanks.set(
        rr + 11,
        (50 * Math.pow(rr, 3) + 75 * Math.pow(rr, 2) + 25 * rr) / 6
      );
    }
    const hardcodedRanks: [number, number][] = [
      [111, 9111713], [112, 10114001], [113, 11226541], [114, 12461460],
      [115, 13832221], [116, 15353765], [117, 17042680], [118, 18917374],
      [119, 20998286], [120, 23308097], [121, 25871988], [122, 28717906],
      [123, 31876876], [124, 35383333], [125, 39275499], [126, 43595804],
      [127, 48391343], [128, 53714390], [129, 59622973], [130, 66181501],
      [131, 73461466], [132, 81542227], [133, 90511872], [134, 100468178],
      [135, 111519678], [136, 123786843], [137, 137403395], [138, 152517769],
      [139, 169294723], [140, 187917143],
    ];

    for (const [rank, points] of hardcodedRanks) {
      realmRanks.set(rank, points);
    }

    return realmRanks;
  }, []);

  const getRealmRankForPoints = useCallback((points: number) => {
    let rank = 0;
    for (const [rr, requiredPoints] of Array.from(realmRanksMap)) {
      if (points >= requiredPoints) {
        rank = rr;
      } else {
        break;
      }
    }
    return rank;
  }, [realmRanksMap]);

  const formatRealmRankWithLevel = useCallback((rank: number) => {
    const rankString = rank.toString();
    return `${rankString.slice(0, -1)}L${rankString.slice(-1)}`;
  }, []);

  const fetchCharacters = useCallback(async (name: string, cluster: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?name=${name}&cluster=${cluster}`
    );
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    return response.json();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.length < 3) {
        if (debouncedSearchTerm.length > 0) {
          setSearchError("Please enter at least 3 characters");
        } else {
          setSearchError("");
        }
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setSearchError("");
      setHasSearched(true);
      setIsSearching(true);
      
      try {
        const results = await fetchCharacters(debouncedSearchTerm, cluster);
        if (results && results.results) {
          setSearchResults(results.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching characters:", error);
        setSearchError("Failed to search characters. Please try again.");
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, cluster, fetchCharacters]);

  const handleToggleCharacter = useCallback((character: CharacterType) => {
    setSelectedCharacters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(character.character_web_id)) {
        newSet.delete(character.character_web_id);
      } else {
        newSet.add(character.character_web_id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(searchResults.map(char => char.character_web_id));
    setSelectedCharacters(allIds);
  }, [searchResults]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCharacters(new Set());
  }, []);

  const selectedCharactersList = useMemo(() => {
    return searchResults.filter(char => selectedCharacters.has(char.character_web_id));
  }, [searchResults, selectedCharacters]);

  const handleAddCharacters = useCallback(async () => {
    if (selectedCharacters.size === 0) return;
    
    setIsAdding(true);
    setSearchError("");

    try {
      const webIds = Array.from(selectedCharacters);
      const response = await fetch("/api/characters/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webIds }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add characters");
      }

      const count = selectedCharacters.size;
      setSuccessMessage(
        `Successfully added ${count === 1 ? "1 character" : `${count} characters`}!`
      );
      setShowSuccess(true);
      
      setTimeout(() => setShowSuccess(false), 4000);
      
      setSelectedCharacters(new Set());
      setSearchResults([]);
      setName("");
      setHasSearched(false);
      
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error adding characters:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to add characters");
    } finally {
      setIsAdding(false);
    }
  }, [selectedCharacters, router]);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setName("");
    setSelectedCharacters(new Set());
    setHasSearched(false);
    setSearchError("");
  }, []);

  const servers = { ywain: "Ywain" };

  const isMinimumLength = name.length >= 3;
  const hasResults = searchResults.length > 0;
  const hasSelections = selectedCharacters.size > 0;
  const allSelected = hasResults && selectedCharacters.size === searchResults.length;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Add Characters</h2>
        </div>
        <CharacterSearchAndAddTooltip />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search character name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              classNames={{
                input: "text-white placeholder:text-gray-500",
                inputWrapper: [
                  "bg-gray-800/50",
                  "border-gray-600",
                  "hover:border-gray-500",
                  "group-data-[focused=true]:border-indigo-500",
                  "group-data-[focused=true]:bg-gray-800/80"
                ]
              }}
            />
          </div>
          
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="bordered" 
                className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                {servers[cluster as keyof typeof servers]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[cluster]}
              onSelectionChange={(keys) => setCluster(Array.from(keys)[0] as string)}
              className="bg-gray-800"
            >
              {Object.entries(servers).map(([key, label]) => (
                <DropdownItem key={key} className="text-gray-300">
                  {label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {searchError && (
          <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{searchError}</span>
          </div>
        )}

        {showSuccess && (
          <div className="flex items-center space-x-2 text-green-400 bg-green-900/20 border border-green-800/50 rounded-lg p-3">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        {isSearching && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-gray-400 text-sm">Searching characters...</p>
          </div>
        )}

        {!isSearching && hasSearched && !hasResults && isMinimumLength && (
          <div className="text-center py-8">
            <p className="text-gray-400">No characters found matching &ldquo;{name}&rdquo;</p>
          </div>
        )}

        {hasResults && (
          <>
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-white font-medium">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </span>
                  {hasSelections && (
                    <span className="text-indigo-400 text-sm">
                      {selectedCharacters.size} selected
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {hasResults && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={allSelected ? handleDeselectAll : handleSelectAll}
                      className="text-gray-400 hover:text-white"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    color="primary"
                    isDisabled={!hasSelections || isAdding}
                    isLoading={isAdding}
                    onClick={handleAddCharacters}
                    startContent={!isAdding ? <Plus className="w-4 h-4" /> : null}
                  >
                    {isAdding ? "Adding..." : `Add ${hasSelections ? `(${selectedCharacters.size})` : ""}`}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="light"
                    onClick={handleClearSearch}
                    startContent={<X className="w-4 h-4" />}
                    className="text-gray-400 hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {isAdding && (
                <div className="mt-3">
                  <Progress 
                    size="sm" 
                    isIndeterminate 
                    color="primary"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((character) => {
                const realmRank = getRealmRankForPoints(character.realm_points);
                const formattedRealmRank = formatRealmRankWithLevel(realmRank);
                return (
                  <CharacterItem
                    key={character.character_web_id}
                    character={character}
                    isSelected={selectedCharacters.has(character.character_web_id)}
                    onToggle={handleToggleCharacter}
                    formattedRealmRank={formattedRealmRank}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CharacterSearchAndAdd;
