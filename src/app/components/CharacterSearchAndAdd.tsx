"use client";
import React, { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import useDebounce from "./UseDebounce";
import {
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import CharacterSearchAndAddTooltip from "./CharacterSearchAndAddTooltip";
import { getRealmRankForPoints, formatRealmRankWithLevel } from "@/utils/character";

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
  const [message, setMessage] = useState("");

  const debouncedSearchTerm = useDebounce(name, 300);

  

  const fetchCharacters = useCallback(async (name: string, cluster: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/characters/search?name=${name}&cluster=${cluster}`,
      { cache: 'no-store' }
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
          setMessage("Please enter at least 3 characters");
        } else {
          setMessage("");
        }
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setMessage("");
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
        setMessage("Failed to search characters. Please try again.");
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, cluster, fetchCharacters]);

  const handleToggleCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  }, []);

  const handleAddCharacters = useCallback(async () => {
    if (selectedCharacters.size === 0 || !userId) return;
    
    setIsAdding(true);
    setMessage("");

    try {
      const webIds = Array.from(selectedCharacters);
      
      const response = await fetch("/api/characters/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webIds }),
        cache: 'no-store',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add characters");
      }

      const count = selectedCharacters.size;
      setMessage(`Successfully added ${count} character${count !== 1 ? 's' : ''}`);
      
      // Clear form immediately
      setSelectedCharacters(new Set());
      setSearchResults([]);
      setName("");
      setHasSearched(false);
      
      // Refresh the page to show new characters
      startTransition(() => {
        router.refresh();
      });
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error adding characters:", error);
      setMessage(error instanceof Error ? error.message : "Failed to add characters");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsAdding(false);
    }
  }, [selectedCharacters, router, userId, startTransition]);

  const handleClear = useCallback(() => {
    setSearchResults([]);
    setName("");
    setSelectedCharacters(new Set());
    setHasSearched(false);
    setMessage("");
  }, []);

  const servers = { ywain: "Ywain" };
  const hasResults = searchResults.length > 0;
  const hasSelections = selectedCharacters.size > 0;
  const isLoading = isAdding || isPending;

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Add Characters</h2>
        <CharacterSearchAndAddTooltip />
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Character name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          classNames={{
            input: "text-white bg-transparent",
            inputWrapper: [
              "bg-gray-800",
              "border-gray-600",
              "data-[hover=true]:bg-gray-700",
              "group-data-[focused=true]:bg-gray-800"
            ].join(" ")
          }}
        />
        
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered" className="bg-gray-800 border-gray-600 text-gray-300">
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

      {message && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-w-sm">
          <span className="text-sm text-white">{message}</span>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            <span className="text-gray-400">Searching characters...</span>
          </div>
        </div>
      )}

      {!isSearching && hasSearched && !hasResults && name.length >= 3 && (
        <div className="text-center py-4 text-gray-400">
          No characters found
        </div>
      )}

      {hasResults && (
        <>
          <div className="mb-4 text-sm text-gray-400">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            {hasSelections && ` • ${selectedCharacters.size} selected`}
          </div>

          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {searchResults.map((character) => {
              const realmRank = getRealmRankForPoints(character.realm_points);
              const formattedRealmRank = formatRealmRankWithLevel(realmRank);
              const isSelected = selectedCharacters.has(character.character_web_id);
              
              return (
                <div
                  key={character.character_web_id}
                  onClick={() => handleToggleCharacter(character.character_web_id)}
                  className={`
                    p-3 rounded cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-gray-700 border-l-4 border-indigo-500' 
                      : 'bg-gray-800 hover:bg-gray-750'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCharacter(character.character_web_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                          disabled={isLoading}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">
                            {character.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            Lvl {character.level} {character.class_name}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-indigo-400">
                        RR {formattedRealmRank}
                      </div>
                      <div className="text-xs text-gray-500">
                        {character.guild_info?.guild_name || "No Guild"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddCharacters}
              disabled={!hasSelections || isLoading}
              className={`
                flex items-center space-x-2
                ${hasSelections && !isLoading
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add{hasSelections ? ` (${selectedCharacters.size})` : ""}</span>
              )}
            </Button>
            
            <Button
              onClick={handleClear}
              variant="bordered"
              className="border-gray-600 text-gray-400 hover:text-gray-300"
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span className="text-white">Adding characters...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterSearchAndAdd;
