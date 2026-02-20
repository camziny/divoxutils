"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useDebounce from "./UseDebounce";
import Loading from "../loading";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";
import SupporterBadge, { supporterRowClass, supporterNameStyle } from "./SupporterBadge";

type Character = {
  characterName: string;
  heraldName: string;
  totalRealmPoints: number;
  className: string;
  user: {
    id: number;
    clerkUserId: string;
    name: string;
  };
};

type User = {
  id: number;
  clerkUserId: string;
  name: string;
  supporterTier: number;
  characters: Character[];
};

export default function CharacterNameSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<{
    users: User[];
    characters: Character[];
  }>({ users: [], characters: [] });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 3) {
        setSearchResults({ users: [], characters: [] });
        setSearchPerformed(false);
        setIsLoading(false);
        return;
      }

      setSearchPerformed(true);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/searchUsersAndCharacters?name=${encodeURIComponent(
            debouncedQuery
          )}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const results = await response.json();
        setSearchResults({
          users: results.users || [],
          characters: results.characters || [],
        });
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setSearchResults({ users: [], characters: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-4">
          <input
            type="text"
            placeholder="Search users or characters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors duration-150"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loading />
          </div>
        ) : (searchResults.users && searchResults.users.length > 0) ||
          (searchResults.characters && searchResults.characters.length > 0) ? (
          <div className="space-y-2">
            {searchResults.users.map((user) => (
              <Link
                key={user.id}
                href={`/user/${user.name}/characters`}
                className={`block bg-gray-900 border border-gray-800 rounded-md hover:border-gray-700 hover:bg-gray-800/50 transition-colors duration-150 relative overflow-hidden ${supporterRowClass(user.supporterTier)}`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-400 inline-flex items-center gap-1.5">
                      <span style={supporterNameStyle(user.supporterTier)}>{user.name}</span>
                      {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} />}
                    </span>
                    <span className="text-xs text-gray-600 tabular-nums">
                      {user.characters.length} character{user.characters.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {user.characters.length > 0 && (
                    <div className="divide-y divide-gray-800">
                      {user.characters
                        .filter((userCharacter) =>
                          userCharacter.heraldName
                            .toLowerCase()
                            .includes(debouncedQuery.toLowerCase())
                        )
                        .map((userCharacter, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-300">
                                {userCharacter.heraldName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {userCharacter.className}
                              </span>
                            </div>
                            {userCharacter.totalRealmPoints > 0 && (
                              <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                                {formatRealmRankWithLevel(
                                  getRealmRankForPoints(
                                    userCharacter.totalRealmPoints
                                  )
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            
            {searchResults.characters.map((character, index) => (
              <Link
                key={`${character.heraldName}-${index}`}
                href={`/user/${character.user.name}/characters`}
                className="block bg-gray-900 border border-gray-800 rounded-md hover:border-gray-700 hover:bg-gray-800/50 transition-colors duration-150"
              >
                <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-400">
                      {character.user.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {character.heraldName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {character.className}
                      </span>
                    </div>
                    {character.totalRealmPoints > 0 && (
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                        {formatRealmRankWithLevel(
                          getRealmRankForPoints(character.totalRealmPoints)
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : debouncedQuery.length > 0 && debouncedQuery.length < 3 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">Enter at least 3 characters to search</p>
          </div>
        ) : searchPerformed ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">No results found</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
