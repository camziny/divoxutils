"use client";
import React, { useState, useMemo, useCallback, memo, useTransition } from "react";
import dynamic from "next/dynamic";
import CharacterTableHeader from "./CharacterTableHeader";
import CharacterListSkeleton from "./CharacterListSkeleton";
import { CharacterData } from "@/utils/character";
import { sortCharacters } from "@/utils/sortCharacters";
import SortOptions from "./SortOptions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
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
  userId?: string;
};

const CharacterListOptimized: React.FC<CharacterListProps> = ({
  characters,
  searchParams,
  showDelete = true,
  userId,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingCharacterId, setDeletingCharacterId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
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
    async (characterId: number, characterName: string) => {
      if (!user || !user.id) {
        setMessage("You must be logged in to delete characters");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      setConfirmDelete({ id: characterId, name: characterName });
    },
    [user]
  );

  const confirmDeleteAction = useCallback(async () => {
    if (!confirmDelete || !user) return;
    
    const { id: characterId, name: characterName } = confirmDelete;
    setConfirmDelete(null);
    setDeletingCharacterId(characterId);
    setMessage("");

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
      setMessage(`Successfully deleted ${characterName}`);
      
      setTimeout(() => {
        setMessage("");
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error deleting character:", error);
      setMessage(error instanceof Error ? error.message : "Failed to delete character");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setDeletingCharacterId(null);
    }
  }, [confirmDelete, user]);

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
                  onDelete={showDelete ? () => handleDelete(character.id, character.heraldName) : undefined}
                  isDeleting={deletingCharacterId === character.id}
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
              onDelete={showDelete ? () => handleDelete(character.id, character.heraldName) : undefined}
              isDeleting={deletingCharacterId === character.id}
            />
          ))}
        </div>
      </div>

      {message && (
        <div className="mt-4 p-3 text-center bg-gray-800 border border-gray-600 rounded-lg">
          <span className="text-sm text-gray-300">{message}</span>
        </div>
      )}

      {isPending && (
        <div className="mt-4 p-3 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
            <span className="text-sm text-gray-400">Updating...</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AggregateStatistics characters={sortedCharacters} />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-sm w-full mx-4">
            <h3 className="text-white font-semibold mb-4">Delete Character</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{confirmDelete.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="bordered"
                onClick={() => setConfirmDelete(null)}
                className="border-gray-600 text-gray-400 hover:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAction}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterListOptimized; 