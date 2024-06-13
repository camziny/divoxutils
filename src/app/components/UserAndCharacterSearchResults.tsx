"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useDebounce from "./UseDebounce";
import { Input } from "@nextui-org/react";
import Loading from "../loading";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
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
    <div className="flex flex-col items-center justify-center my-10 bg-gray-900 px-4">
      <form className="flex justify-center mb-6 w-full max-w-md">
        <Input
          size="sm"
          type="text"
          placeholder="Search users or characters"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          classNames={{
            label: "text-gray-500 dark:text-gray-300",
            input: [
              "bg-transparent",
              "text-gray-300 dark:text-gray-200",
              "placeholder:text-gray-400 text-base dark:placeholder:text-gray-500",
            ],
            innerWrapper: "bg-transparent",
            inputWrapper: [
              "shadow-xl",
              "bg-gray-800",
              "dark:bg-gray-700",
              "hover:bg-gray-700 dark:hover:bg-gray-600",
              "group-data-[focused=true]:bg-gray-800 dark:group-data-[focused=true]:bg-gray-700",
              "border border-indigo-500",
              "focus:border-indigo-600",
              "!cursor-text",
            ],
          }}
        />
      </form>
      <div className="w-full max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Loading />
          </div>
        ) : (searchResults.users && searchResults.users.length > 0) ||
          (searchResults.characters && searchResults.characters.length > 0) ? (
          <>
            {searchResults.users.map((user) => (
              <Card
                key={user.id}
                className="mb-4 bg-gray-800 rounded-lg shadow-md"
              >
                <Link
                  href={`/user/${user.name}/characters`}
                  className="hover:text-indigo-400"
                >
                  <CardHeader className="bg-gray-700 text-indigo-400 text-xl font-semibold cursor-pointer">
                    {user.name}
                  </CardHeader>
                  <CardBody>
                    <ul className="list-disc pl-6 mt-2 text-gray-300">
                      {user.characters.length > 0 ? (
                        user.characters
                          .filter((userCharacter) =>
                            userCharacter.heraldName
                              .toLowerCase()
                              .includes(debouncedQuery.toLowerCase())
                          )
                          .map((userCharacter, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-4"
                            >
                              <span className="font-semibold text-lg text-gray-300">
                                {userCharacter.heraldName}
                              </span>
                              <span className="text-base font-semibold text-indigo-400">
                                {userCharacter.className}
                              </span>
                              {userCharacter.totalRealmPoints > 0 && (
                                <span className="text-sm font-semibold text-indigo-400">
                                  {formatRealmRankWithLevel(
                                    getRealmRankForPoints(
                                      userCharacter.totalRealmPoints
                                    )
                                  )}
                                </span>
                              )}
                            </li>
                          ))
                      ) : (
                        <li className="flex items-center space-x-4">
                          <span className="font-semibold text-lg text-gray-300">
                            No characters found with the name &apos;{query}
                            &apos;
                          </span>
                        </li>
                      )}
                    </ul>
                  </CardBody>
                </Link>
              </Card>
            ))}
            {searchResults.characters.map((character, index) => (
              <Card
                key={`${character.heraldName}-${index}`}
                className="mb-4 bg-gray-800 rounded-lg shadow-md"
              >
                <Link
                  href={`/user/${character.user.name}/characters`}
                  className="hover:text-indigo-400"
                >
                  <CardHeader className="bg-gray-700 text-indigo-400 text-xl font-semibold cursor-pointer">
                    {character.user.name}
                  </CardHeader>
                  <CardBody>
                    <ul className="list-disc pl-6 mt-2 text-gray-300">
                      <li className="flex items-center space-x-4">
                        <span className="font-semibold text-lg text-gray-300">
                          {character.heraldName}
                        </span>
                        <span className="text-base font-semibold text-indigo-400">
                          {character.className}
                        </span>
                        {character.totalRealmPoints > 0 && (
                          <span className="text-sm font-semibold text-indigo-400">
                            {formatRealmRankWithLevel(
                              getRealmRankForPoints(character.totalRealmPoints)
                            )}
                          </span>
                        )}
                      </li>
                    </ul>
                  </CardBody>
                </Link>
              </Card>
            ))}
          </>
        ) : debouncedQuery.length > 0 && debouncedQuery.length < 3 ? (
          <p className="text-gray-300 text-center">
            Enter at least 3 characters to search
          </p>
        ) : searchPerformed ? (
          <p className="text-gray-500 text-center">No results found</p>
        ) : null}
      </div>
    </div>
  );
}
