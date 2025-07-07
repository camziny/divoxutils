"use client";
import React, { useState, useMemo, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import CharacterTableHeader from "./CharacterTableHeader";
import CharacterListSkeleton from "./CharacterListSkeleton";
import { CharacterData } from "@/utils/character";
import { sortCharacters } from "@/utils/sortCharacters";
import SortOptions from "./SortOptions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@mui/material";

const CharacterTile = dynamic(() => import("./CharacterTile"), {
  loading: () => <div className="h-16 animate-pulse bg-gray-800" />,
});

const MobileCharacterTile = dynamic(() => import("./MobileCharacterTile"), {
  loading: () => <div className="h-24 animate-pulse bg-gray-800" />,
});

const AggregateStatistics = dynamic(() => import("./CharacterListSummary"), {
  loading: () => <div className="h-20 animate-pulse bg-gray-800" />,
});

type CharacterListProps = {
  characters: CharacterData[];
  searchParams: { [key: string]: string | string[] };
  showDelete?: boolean;
  userId?: string; // For additional permission checks if needed
};

const CharacterListOptimized: React.FC<CharacterListProps> = ({
  characters,
  searchParams,
  showDelete = true,
  userId,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const initialSortOption = (searchParams?.sortOption || "realm") as string;
  const [sortOption, setSortOption] = useState(initialSortOption);

  const sortedCharacters = useMemo(
    () => sortCharacters(characters, sortOption),
    [characters, sortOption]
  );

  const handleSortChange = useCallback((option: string) => {
    setSortOption(option);
  }, []);

  const handleDelete = useCallback(
    async (characterId: number) => {
      if (!user || !user.id) {
        console.error("User is not authenticated.");
        return;
      }

      const isConfirmed = window.confirm(
        "Are you sure you want to delete this character?"
      );

      if (!isConfirmed) {
        return;
      }

      try {
        const response = await fetch(
          `/api/userCharacters/${user.id}/${characterId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete the character.");
        }

        const data = await response.json();
        alert(data.message);
        router.refresh();
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error deleting character:", error.message);
          alert(error.message);
        } else {
          console.error("Unexpected error", error);
          alert("An unexpected error occurred");
        }
      }
    },
    [user, router]
  );

  const EmptyState = memo(() => (
    <div className="text-center py-8 text-white bg-gray-900/80 backdrop-blur-sm rounded-lg mx-2">
      <div className="text-lg font-semibold">No characters available</div>
      <div className="text-gray-400 text-sm mt-2">
        {showDelete
          ? "Add some characters to get started!"
          : "This user hasn't added any characters yet."}
      </div>
    </div>
  ));

  EmptyState.displayName = "EmptyState";

  const tableContainerStyles = useMemo(
    () => ({
      background:
        "linear-gradient(180deg, rgba(17, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)",
      backdropFilter: "blur(8px)",
      boxShadow: "none",
      borderRadius: "16px",
      "& .MuiTable-root": {
        borderCollapse: "separate",
        borderSpacing: "0 1px",
      },
    }),
    []
  );

  if (sortedCharacters.length === 0) {
    return (
      <div className="flex flex-col items-center w-full max-w-6xl">
        <SortOptions sortOption={sortOption} onSortChange={handleSortChange} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl">
      <SortOptions sortOption={sortOption} onSortChange={handleSortChange} />

      <div className="hidden sm:block w-full">
        <TableContainer
          component={Paper}
          className="max-h-[60vh] lg:max-h-[70vh] xl:max-h-[75vh]"
          sx={tableContainerStyles}
        >
          <Table stickyHeader style={{ tableLayout: "fixed" }}>
            <TableHead>
              <CharacterTableHeader />
            </TableHead>
            <TableBody>
              {sortedCharacters.map((character: CharacterData) => (
                <CharacterTile
                  key={character.id}
                  webId={character.webId}
                  character={character}
                  characterDetails={character}
                  formattedHeraldRealmPoints={
                    character.formattedHeraldRealmPoints
                  }
                  initialCharacter={character.initialCharacter}
                  heraldBountyPoints={character.heraldBountyPoints}
                  heraldTotalKills={character.heraldTotalKills}
                  heraldTotalDeaths={character.heraldTotalDeaths}
                  realmPointsLastWeek={character.realmPointsLastWeek}
                  totalRealmPoints={character.totalRealmPoints}
                  currentUserId={character.initialCharacter?.userId}
                  ownerId={character.clerkUserId}
                  heraldServerName={character.heraldServerName}
                  showDelete={showDelete}
                  onDelete={showDelete ? () => handleDelete(character.id) : undefined}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="sm:hidden w-full">
        <div className="max-h-[60vh] overflow-y-auto rounded-lg">
          {sortedCharacters.map((character: CharacterData) => (
            <MobileCharacterTile
              key={character.id}
              webId={character.webId}
              character={character}
              characterDetails={character}
              formattedHeraldRealmPoints={character.formattedHeraldRealmPoints}
              initialCharacter={character.initialCharacter}
              heraldBountyPoints={character.heraldBountyPoints}
              heraldTotalKills={character.heraldTotalKills}
              heraldTotalDeaths={character.heraldTotalDeaths}
              realmPointsLastWeek={character.realmPointsLastWeek}
              totalRealmPoints={character.totalRealmPoints}
              currentUserId={character.initialCharacter?.userId}
              ownerId={character.clerkUserId}
              heraldServerName={character.heraldServerName}
              showDelete={showDelete}
              onDelete={showDelete ? () => handleDelete(character.id) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <AggregateStatistics characters={sortedCharacters} />
      </div>
    </div>
  );
};

export default CharacterListOptimized; 