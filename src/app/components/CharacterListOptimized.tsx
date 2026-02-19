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
import { Loader2, AlertTriangle } from "lucide-react";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableHead,
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
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete the character.");
      }

      setMessage(`Successfully deleted ${characterName}`);

      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting character:", error);
      setMessage(error instanceof Error ? error.message : "Failed to delete character");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setDeletingCharacterId(null);
    }
  }, [confirmDelete, user, router, startTransition]);

  const EmptyState = memo(() => (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <p className="text-sm font-medium text-gray-300 mb-1">
          No characters yet
        </p>
        <p className="text-xs text-gray-600 text-center max-w-xs">
          {showDelete
            ? "Use the search above to find and add your characters."
            : "This user hasn't added any characters yet."}
        </p>
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
      borderRadius: "12px",
      border: "1px solid rgb(31, 41, 55)",
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
        <div className="fixed bottom-4 right-4 z-50 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg shadow-lg max-w-sm">
          <span className="text-xs text-gray-300">{message}</span>
        </div>
      )}

      {isPending && (
        <div className="mt-4 p-3 text-center">
          <div className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-indigo-400" />
            <span className="text-xs text-gray-500">Updating...</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AggregateStatistics characters={sortedCharacters} />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="delete-confirm-overlay">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-sm w-full mx-4 overflow-hidden" data-testid="delete-confirm-modal">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-200">Delete Character</h3>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 flex-shrink-0 mt-0.5">
                  <AlertTriangle size={14} className="text-red-400" />
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Are you sure you want to remove <span className="text-gray-200 font-medium">{confirmDelete.name}</span> from your list?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                onClick={() => setConfirmDelete(null)}
                data-testid="delete-confirm-cancel"
                className="h-8 px-3 rounded-md text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                data-testid="delete-confirm-submit"
                className="h-8 px-3 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterListOptimized;
