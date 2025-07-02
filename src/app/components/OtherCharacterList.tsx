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

type OtherCharacterListProps = {
  userId?: string;
  characters: CharacterData[];
  searchParams: { [key: string]: string | string[] };
};

const OtherCharacterList: React.FC<OtherCharacterListProps> = ({
  userId,
  characters,
  searchParams,
}) => {
  const initialSortOption = (searchParams?.sortOption || "realm") as string;
  const [sortOption, setSortOption] = useState(initialSortOption);

  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  const sortedCharacters = sortCharacters(characters || [], sortOption);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl">
      <SortOptions sortOption={sortOption} onSortChange={handleSortChange} />
      <div className="hidden sm:block w-full">
        <TableContainer 
          component={Paper} 
          className="max-h-[60vh] lg:max-h-[70vh] xl:max-h-[75vh]"
          sx={{ 
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
                  <TableCell colSpan={9} className="text-center py-4">
                    <div>
                      <strong>No characters available</strong>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCharacters.map((character) => (
                  <CharacterTile
                    key={character.webId ?? ''}
                    webId={character.webId ?? ''}
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
                    showDelete={false}
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
            <div className="text-gray-400 text-sm mt-2">This user hasn&apos;t added any characters yet.</div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg">
            {sortedCharacters.map((character: CharacterData) => (
              <MobileCharacterTile
                key={character.id}
                webId={character.webId ?? ''}
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
                heraldServerName={character.heraldServerName}
                ownerId={character.clerkUserId}
                showDelete={false}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-center items-center mt-4">
        <AggregateStatistics characters={sortedCharacters} />
      </div>
    </div>
  );
};

export default OtherCharacterList;
