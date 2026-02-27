"use client";
import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import useDebounce from "./UseDebounce";
import { Plus, X, Loader2, Search } from "lucide-react";
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
    const params = new URLSearchParams({ name, cluster });
    const response = await fetch(`/api/characters/search?${params.toString()}`, {
      cache: "no-store",
    });
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
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add characters");
      }

      const count = selectedCharacters.size;
      setMessage(`Successfully added ${count} character${count !== 1 ? "s" : ""}`);

      setSelectedCharacters(new Set());
      setSearchResults([]);
      setName("");
      setHasSearched(false);

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

  const hasResults = searchResults.length > 0;
  const hasSelections = selectedCharacters.size > 0;
  const isLoading = isAdding || isPending;
  const isExpanded = isSearching || hasSearched || hasResults || hasSelections || Boolean(message);

  return (
    <div className="relative z-20 rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm overflow-visible">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search and add characters..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="character-search-input"
              className="w-full h-9 pl-8 pr-8 rounded-lg border border-gray-800 bg-gray-950/50 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-all"
            />
            {name && (
              <button
                onClick={() => { setName(""); setSearchResults([]); setHasSearched(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <CharacterSearchAndAddTooltip />
        </div>

        {isExpanded && message && !hasResults && (
          <p className="mt-3 text-xs text-gray-500">{message}</p>
        )}

        {isExpanded && isSearching && (
          <div className="flex items-center gap-2 mt-4 py-6 justify-center">
            <Loader2 size={14} className="animate-spin text-gray-500" />
            <span className="text-xs text-gray-500">Searching...</span>
          </div>
        )}

        {isExpanded && !isSearching && hasSearched && !hasResults && name.length >= 3 && (
          <div className="mt-4 py-8 text-center">
            <p className="text-sm text-gray-500">No characters found</p>
            <p className="text-[11px] text-gray-700 mt-1">Try a different name or server</p>
          </div>
        )}

        {hasResults && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-600 uppercase tracking-wider font-medium">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </span>
              {hasSelections && (
                <span className="text-[11px] text-indigo-400 font-medium">
                  {selectedCharacters.size} selected
                </span>
              )}
            </div>

            <div className="space-y-px max-h-72 overflow-y-auto rounded-lg border border-gray-800" data-testid="character-search-results">
              {searchResults.map((character, index) => {
                const realmRank = getRealmRankForPoints(character.realm_points);
                const formattedRealmRank = formatRealmRankWithLevel(realmRank);
                const isSelected = selectedCharacters.has(character.character_web_id);

                return (
                  <div
                    key={character.character_web_id}
                    onClick={() => handleToggleCharacter(character.character_web_id)}
                    data-testid={`character-search-result-${character.character_web_id}`}
                    className={`
                      flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all duration-100
                      ${isSelected
                        ? "bg-indigo-500/10"
                        : "bg-gray-900 hover:bg-gray-800/70"
                      }
                      ${index !== searchResults.length - 1 ? "border-b border-gray-800/60" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center justify-center w-4 h-4 rounded transition-all ${
                        isSelected
                          ? "bg-indigo-500 scale-100"
                          : "border border-gray-700 bg-transparent"
                      }`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-gray-300 truncate">
                          {character.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {character.class_name}
                        </span>
                        {character.guild_info?.guild_name && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-xs text-gray-600 truncate">
                              &lt;{character.guild_info.guild_name}&gt;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                        {formattedRealmRank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleAddCharacters}
                disabled={!hasSelections || isLoading}
                data-testid="add-characters-button"
                className={`
                  inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all duration-150
                  ${hasSelections && !isLoading
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-500/20"
                    : "bg-gray-800/80 text-gray-600 cursor-not-allowed"
                  }
                `}
              >
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={12} />
                )}
                {isLoading ? "Adding..." : `Add${hasSelections ? ` (${selectedCharacters.size})` : ""}`}
              </button>

              <button
                onClick={handleClear}
                disabled={isLoading}
                className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors duration-150 disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {message && hasResults && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg shadow-lg max-w-sm">
          <span className="text-xs text-gray-300">{message}</span>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
              <span className="text-sm text-gray-300">Adding characters...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterSearchAndAdd;
