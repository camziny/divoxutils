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
  id: number;
  characterName: string;
  totalRealmPoints: number;
  className: string;
};

type UserCharacter = {
  characterId: number;
  clerkUserId: string;
  character: Character;
};

type UserWithCharacters = {
  id: number;
  clerkUserId: string;
  name: string;
  characters: UserCharacter[];
};

type UserSearchResultsProps = {
  users: UserWithCharacters[];
};

export default function CharacterNameSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<UserWithCharacters[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsersByCharacterName = async () => {
      if (debouncedQuery.trim().length < 3) {
        setSearchResults([]);
        setSearchPerformed(false);
        setIsLoading(false);
        return;
      }

      setSearchPerformed(true);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/users?characterName=${encodeURIComponent(debouncedQuery)}`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const users = await response.json();
        setSearchResults(users);
      } catch (error) {
        console.error("Failed to fetch users by character name:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersByCharacterName();
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col items-center justify-center my-10 bg-gray-900 px-4">
      <form className="flex justify-center mb-6 w-full max-w-md">
        <Input
          size="sm"
          type="text"
          placeholder="Search users by character name"
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
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => (
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
                    {user.characters
                      .filter((userCharacter) =>
                        userCharacter.character.characterName
                          .toLowerCase()
                          .startsWith(debouncedQuery.toLowerCase())
                      )
                      .map((userCharacter, index) => (
                        <li key={index} className="flex items-center space-x-4">
                          <span className="font-semibold text-lg text-gray-300">
                            {userCharacter.character.characterName}
                          </span>
                          <span className="text-base font-semibold text-indigo-400">
                            {userCharacter.character.className}
                          </span>
                          {userCharacter.character.totalRealmPoints > 0 && (
                            <span className="text-sm font-semibold text-indigo-400">
                              {formatRealmRankWithLevel(
                                getRealmRankForPoints(
                                  userCharacter.character.totalRealmPoints
                                )
                              )}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </CardBody>
              </Link>
            </Card>
          ))
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
