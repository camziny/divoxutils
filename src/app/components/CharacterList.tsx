"use client";
import React, { useState } from "react";
import CharacterTile from "./CharacterTile";
import CharacterTableHeader from "./CharacterTableHeader";
import AggregateStatistics from "./CharacterListSummary";
import MobileCharacterTile from "./MobileCharacterTile";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@mui/material";
import { CharacterData } from "@/utils/character";
import { sortCharacters } from "@/utils/sortCharacters";
import SortOptions from "./SortOptions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type CharacterListProps = {
  characters: CharacterData[];
  searchParams: { [key: string]: string | string[] };
};

const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  searchParams,
}) => {
  const { user } = useUser();
  const initialSortOption = (searchParams?.sortOption || "realm") as string;
  const [sortOption, setSortOption] = useState(initialSortOption);

  const router = useRouter();

  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  const sortedCharacters = sortCharacters(characters, sortOption);

  const handleDelete = async (characterId: number) => {
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
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl">
      <SortOptions sortOption={sortOption} onSortChange={handleSortChange} />

      <div className="hidden sm:block w-full">
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: 1000,
            background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)',
            backdropFilter: 'blur(8px)',
            boxShadow: 'none',
            borderRadius: '16px',
            '& .MuiTable-root': {
              borderCollapse: 'separate',
              borderSpacing: '0 1px'
            }
          }}
        >
          <Table stickyHeader style={{ tableLayout: "fixed" }}>
            <TableHead>
              <CharacterTableHeader />
            </TableHead>
            <TableBody>
              {sortedCharacters.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-4 text-white bg-gray-900"
                  >
                    <div>
                      <strong>No characters available</strong>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCharacters.map((character: CharacterData) => (
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
                    onDelete={() => handleDelete(character.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className="sm:hidden w-full">
        {sortedCharacters.length === 0 ? (
          <div className="text-center py-8 text-white bg-gray-900/80 backdrop-blur-sm rounded-lg mx-2">
            <div className="text-lg font-semibold">No characters available</div>
            <div className="text-gray-400 text-sm mt-2">Add some characters to get started!</div>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
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
                onDelete={() => handleDelete(character.id)}
              />
            ))}
          </div>
        )}
      </div>
      <AggregateStatistics characters={sortedCharacters} />
    </div>
  );
};

export default CharacterList;
