"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import useDebounce from "./useDebounce";
import Loading from "@/app/loading";
import { buildSearchUrl, shouldHideUserListForQuery } from "../urlState";
import { useSearchActive } from "../SearchContext";
import {
  formatRealmRankWithLevel,
  getRealmRankForPoints,
} from "@/utils/character";
import SupporterBadge, {
  supporterRowClass,
  supporterNameStyle,
} from "@/components/support/SupporterBadge";

type Character = {
  characterName: string;
  heraldName: string | null;
  totalRealmPoints: number;
  className: string;
};

type User = {
  id: number;
  clerkUserId: string;
  name: string;
  supporterTier: number;
  characters: Character[];
};

export default function CharacterNameSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const safePathname = pathname ?? "/search";
  const { setSearchActive } = useSearchActive();
  const urlQuery = searchParams?.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<{ users: User[] }>({
    users: [],
  });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const normalizedDebouncedQuery = debouncedQuery.trim();
  const liveStatusMessage = isLoading
    ? "Loading search results"
    : normalizedDebouncedQuery.length > 0 && normalizedDebouncedQuery.length < 3
      ? "Enter at least 3 characters to search"
      : searchResults.users.length > 0
        ? `${searchResults.users.length} search results found`
        : searchPerformed
          ? "No results found"
          : "";

  useEffect(() => {
    setQuery((currentQuery) => (currentQuery === urlQuery ? currentQuery : urlQuery));
  }, [urlQuery]);

  useEffect(() => {
    setSearchActive(shouldHideUserListForQuery(query));
  }, [query, setSearchActive]);

  useEffect(() => {
    const { didChange, nextUrl } = buildSearchUrl({
      pathname: safePathname,
      currentSearch: window.location.search.replace(/^\?/, ""),
      debouncedQuery,
    });

    if (!didChange) return;

    window.history.replaceState(null, "", nextUrl);
  }, [debouncedQuery, safePathname]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      if (normalizedDebouncedQuery.length < 3) {
        setSearchResults({ users: [] });
        setSearchPerformed(false);
        setIsLoading(false);
        return;
      }

      setSearchPerformed(true);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/searchUsersAndCharacters?name=${encodeURIComponent(
            normalizedDebouncedQuery
          )}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const results = await response.json();
        setSearchResults({
          users: results.users || [],
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch search results:", error);
        setSearchResults({ users: [] });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [normalizedDebouncedQuery]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-2xl">
        <div className="sr-only" aria-live="polite" role="status">
          {liveStatusMessage}
        </div>
        <form
          role="search"
          aria-label="Search users and characters"
          className="flex justify-center mb-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="user-character-search" className="sr-only">
            Search users or characters
          </label>
          <p id="user-character-search-hint" className="sr-only">
            Enter at least 3 characters to search.
          </p>
          <input
            id="user-character-search"
            name="userCharacterSearch"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search users or characters..."
            aria-describedby="user-character-search-hint"
            aria-controls="search-results-region"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-400 outline-none focus-visible:border-indigo-400/70 focus-visible:ring-2 focus-visible:ring-indigo-400/30 transition-colors duration-150"
          />
        </form>

        {isLoading ? (
          <div className="flex justify-center items-center py-8" role="status">
            <Loading />
          </div>
        ) : searchResults.users && searchResults.users.length > 0 ? (
          <ul
            id="search-results-region"
            className="space-y-2"
            aria-label="Search results"
            aria-busy={isLoading}
          >
            {searchResults.users.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/user/${user.name}/characters`}
                  className={`block bg-gray-900 border border-gray-700 rounded-md hover:border-gray-600 hover:bg-gray-800/50 transition-colors duration-150 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 ${supporterRowClass(user.supporterTier)}`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-400 inline-flex items-center gap-1.5">
                        <span style={supporterNameStyle(user.supporterTier)}>{user.name}</span>
                        {user.supporterTier > 0 && <SupporterBadge tier={user.supporterTier} />}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {user.characters.length} character{user.characters.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {user.characters.length > 0 && (
                      <div className="divide-y divide-gray-800">
                        {user.characters.map((userCharacter, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-300">
                                {userCharacter.heraldName ||
                                  userCharacter.characterName}
                              </span>
                              <span className="text-xs text-gray-300">
                                {userCharacter.className}
                              </span>
                            </div>
                            {userCharacter.totalRealmPoints > 0 && (
                              <span className="text-[11px] font-medium text-gray-200 bg-gray-700 px-1.5 py-0.5 rounded">
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
              </li>
            ))}
          </ul>
        ) : normalizedDebouncedQuery.length > 0 && normalizedDebouncedQuery.length < 3 ? (
          <div id="search-results-region" className="text-center py-8">
            <p className="text-gray-300 text-sm">Enter at least 3 characters to search</p>
          </div>
        ) : searchPerformed ? (
          <div id="search-results-region" className="text-center py-8">
            <p className="text-gray-300 text-sm">No results found</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
