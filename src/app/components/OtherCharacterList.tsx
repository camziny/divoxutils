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
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
      <SortOptions sortOption={sortOption} onSortChange={handleSortChange} />
      <div className="hidden sm:block character-table-container w-full">
        <TableContainer component={Paper} sx={{ maxHeight: 1000 }}>
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
                    showDelete={false}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className="sm:hidden overflow-auto text-white max-h-[500px] w-full">
        {sortedCharacters.length === 0 ? (
          <div className="text-center py-4 text-white bg-gray-900">
            No characters available
          </div>
        ) : (
          sortedCharacters.map((character: CharacterData) => (
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
              showDelete={false}
            />
          ))
        )}
      </div>
      <AggregateStatistics characters={sortedCharacters} />
    </div>
  );
};

export default OtherCharacterList;
