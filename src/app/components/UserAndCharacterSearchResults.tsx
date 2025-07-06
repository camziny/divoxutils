"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useDebounce from "./UseDebounce";
import { Input } from "@nextui-org/react";
import Loading from "../loading";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";

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
        console.log(`Fetching results for query: ${debouncedQuery}`);
        const response = await fetch(
          `/api/searchUsersAndCharacters?name=${encodeURIComponent(
            debouncedQuery
          )}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const results = await response.json();
        console.log("Search Results:", results);
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
    <div className="flex flex-col items-center justify-center my-6 bg-gray-900 px-4">
      <div className="w-full max-w-2xl mb-4">
        <div className="flex justify-center mb-4">
          <Input
            size="md"
            type="text"
            placeholder="Search users or characters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            classNames={{
              label: "text-gray-400",
              input: [
                "bg-transparent",
                "!text-gray-200",
                "placeholder:text-gray-500 text-sm sm:text-base",
              ],
              innerWrapper: "bg-transparent",
              inputWrapper: [
                "shadow-lg",
                "!bg-gray-800",
                "hover:!bg-gray-700",
                "group-data-[focused=true]:!bg-gray-700",
                "data-[focused=true]:!bg-gray-700",
                "border border-gray-700",
                "hover:border-indigo-500/50",
                "group-data-[focused=true]:border-indigo-500",
                "data-[focused=true]:border-indigo-500",
                "!cursor-text",
                "transition-all duration-200",
              ],
            }}
            className="w-full max-w-md"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loading />
          </div>
        ) : (searchResults.users && searchResults.users.length > 0) ||
          (searchResults.characters && searchResults.characters.length > 0) ? (
          <div className="space-y-3">
            {searchResults.users.map((user) => (
              <div
                key={user.id}
                className="bg-gray-800 rounded-lg border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg"
              >
                <Link
                  href={`/user/${user.name}/characters`}
                  className="block p-4 hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-indigo-400 hover:text-indigo-300">
                      {user.name}
                    </h3>
                    <span className="text-sm text-gray-400">
                      {user.characters.length} character{user.characters.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {user.characters.length > 0 ? (
                      user.characters
                        .filter((userCharacter) =>
                          userCharacter.heraldName
                            .toLowerCase()
                            .includes(debouncedQuery.toLowerCase())
                        )
                        .map((userCharacter, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded-md"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-200">
                                {userCharacter.heraldName}
                              </span>
                              <span className="text-sm text-indigo-400">
                                {userCharacter.className}
                              </span>
                            </div>
                            {userCharacter.totalRealmPoints > 0 && (
                              <span className="text-xs font-medium text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">
                                {formatRealmRankWithLevel(
                                  getRealmRankForPoints(
                                    userCharacter.totalRealmPoints
                                  )
                                )}
                              </span>
                            )}
                          </div>
                        ))
                    ) : (
                      <div className="py-2 px-3 text-gray-400 text-sm">
                        No characters found with the name &apos;{query}&apos;
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
            
            {searchResults.characters.map((character, index) => (
              <div
                key={`${character.heraldName}-${index}`}
                className="bg-gray-800 rounded-lg border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg"
              >
                <Link
                  href={`/user/${character.user.name}/characters`}
                  className="block p-4 hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-indigo-400 hover:text-indigo-300">
                      {character.user.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded-md">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-200">
                        {character.heraldName}
                      </span>
                      <span className="text-sm text-indigo-400">
                        {character.className}
                      </span>
                    </div>
                    {character.totalRealmPoints > 0 && (
                      <span className="text-xs font-medium text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">
                        {formatRealmRankWithLevel(
                          getRealmRankForPoints(character.totalRealmPoints)
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : debouncedQuery.length > 0 && debouncedQuery.length < 3 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Enter at least 3 characters to search</p>
          </div>
        ) : searchPerformed ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
