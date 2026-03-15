"use client";
import React, { useState, useMemo, useCallback, memo, useTransition } from "react";
import dynamic from "next/dynamic";
import CharacterTableHeader from "./CharacterTableHeader";
import CharacterListSkeleton from "./CharacterListSkeleton";
import { CharacterData } from "@/utils/character";
import { sortCharacters } from "@/utils/sortCharacters";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, LayoutGrid, List, ArrowDownWideNarrow, ArrowUpNarrowWide, Layers, SlidersHorizontal } from "lucide-react";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableHead,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ClassFilter,
  filterCharactersByClass,
  getEffectiveCharacterSortKey,
  getNextColumnSortState,
  normalizeClassFilter,
} from "@/utils/characterListControls";

const CharacterTile = dynamic(() => import("./CharacterTile"), {
  loading: () => <div className="h-16 animate-pulse bg-gray-800" />,
});

const MobileCharacterTile = dynamic(() => import("./MobileCharacterTile"), {
  loading: () => <div className="h-24 animate-pulse bg-gray-800" />,
});

const DesktopCharacterCard = dynamic(() => import("./DesktopCharacterCard"), {
  loading: () => <div className="h-5 animate-pulse bg-gray-800 rounded" />,
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

type DesktopLayout = "table" | "realm-grid";
const DESKTOP_LAYOUTS: DesktopLayout[] = ["table", "realm-grid"];
const REALMS: Array<"Albion" | "Midgard" | "Hibernia"> = ["Albion", "Midgard", "Hibernia"];

const CharacterListOptimized: React.FC<CharacterListProps> = ({
  characters,
  searchParams,
  showDelete = true,
  userId,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const activeSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deletingCharacterId, setDeletingCharacterId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const initialSortOption = (searchParams?.sortOption || "realm") as string;
  const initialLayout = (() => {
    const value = searchParams?.layout;
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized && DESKTOP_LAYOUTS.includes(normalized as DesktopLayout)) {
      return normalized as DesktopLayout;
    }
    return "table" as DesktopLayout;
  })();
  const [sortOption, setSortOption] = useState(initialSortOption);
  const [desktopLayout, setDesktopLayout] = useState<DesktopLayout>(initialLayout);
  const initialClassFilter = normalizeClassFilter(searchParams?.classFilter);
  const [classFilter, setClassFilter] = useState<ClassFilter>(initialClassFilter);
  const [columnSort, setColumnSort] = useState<string | null>(null);
  const [columnSortDir, setColumnSortDir] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(initialClassFilter !== "all");

  const filteredCharacters = useMemo(
    () => filterCharactersByClass(characters, classFilter),
    [characters, classFilter]
  );

  const effectiveSortKey = useMemo(
    () => getEffectiveCharacterSortKey(sortOption, columnSort, columnSortDir),
    [columnSort, columnSortDir, sortOption]
  );

  const sortedCharacters = useMemo(
    () => sortCharacters([...filteredCharacters], effectiveSortKey),
    [filteredCharacters, effectiveSortKey]
  );

  const handleSortChange = useCallback((option: string) => {
    if (!option) return;
    setSortOption(option);
    setColumnSort(null);
  }, []);

  const handleLayoutChange = useCallback(
    (value: string) => {
      if (!DESKTOP_LAYOUTS.includes(value as DesktopLayout)) return;
      const nextLayout = value as DesktopLayout;
      setDesktopLayout(nextLayout);
      if (nextLayout === "realm-grid" && sortOption === "realm" && !columnSort) {
        setSortOption("rank-high-to-low");
      }
      const nextParams = new URLSearchParams(activeSearchParams?.toString() || "");
      nextParams.set("layout", nextLayout);
      router.replace(`${pathname}?${nextParams.toString()}`);
    },
    [activeSearchParams, pathname, router, sortOption, columnSort]
  );

  const handleClassFilterChange = useCallback(
    (value: string) => {
      if (!value) return;
      const next = value as ClassFilter;
      setClassFilter(next);
      const nextParams = new URLSearchParams(activeSearchParams?.toString() || "");
      if (next === "all") {
        nextParams.delete("classFilter");
      } else {
        nextParams.set("classFilter", next);
      }
      router.replace(`${pathname}?${nextParams.toString()}`);
    },
    [activeSearchParams, pathname, router]
  );

  const handleColumnSort = useCallback(
    (column: string) => {
      const nextState = getNextColumnSortState(columnSort, columnSortDir, column);
      setColumnSort(nextState.columnSort);
      setColumnSortDir(nextState.columnSortDir);
    },
    [columnSort, columnSortDir]
  );

  const charactersByRealm = useMemo(() => {
    const grouped: Record<"Albion" | "Midgard" | "Hibernia", CharacterData[]> = {
      Albion: [],
      Midgard: [],
      Hibernia: [],
    };
    sortedCharacters.forEach((character) => {
      if (character.realm === "Albion" || character.realm === "Midgard" || character.realm === "Hibernia") {
        grouped[character.realm].push(character);
      }
    });
    return grouped;
  }, [sortedCharacters]);

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

  const toolbarSortValue = columnSort ? "" : sortOption;

  const toolbar = (
    <div className="mb-4 flex flex-col items-center gap-1.5">
      <div className="inline-flex items-center rounded-lg bg-gray-800/60 p-0.5 gap-0.5">
        <div className="hidden sm:flex overflow-hidden">
          <div className="flex items-center gap-0.5 pr-0.5">
            <ToggleGroup value={toolbarSortValue} onValueChange={handleSortChange}>
              {desktopLayout === "table" && (
                <ToggleGroupItem value="realm" className="gap-1">
                  <Layers size={11} />
                  Realm
                </ToggleGroupItem>
              )}
              <ToggleGroupItem value="rank-high-to-low" className="gap-1">
                <ArrowDownWideNarrow size={11} />
                Rank
              </ToggleGroupItem>
              <ToggleGroupItem value="rank-low-to-high" className="gap-1">
                <ArrowUpNarrowWide size={11} />
                Rank
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="w-px h-4 bg-gray-700/60 mx-0.5" />
          </div>
        </div>

        <div className="flex sm:hidden items-center">
          <ToggleGroup value={toolbarSortValue} onValueChange={handleSortChange}>
            <ToggleGroupItem value="realm" className="gap-1">
              <Layers size={11} />
              Realm
            </ToggleGroupItem>
            <ToggleGroupItem value="rank-high-to-low" className="gap-1">
              <ArrowDownWideNarrow size={11} />
              Rank
            </ToggleGroupItem>
            <ToggleGroupItem value="rank-low-to-high" className="gap-1">
              <ArrowUpNarrowWide size={11} />
              Rank
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="hidden sm:flex items-center">
          <ToggleGroup value={desktopLayout} onValueChange={handleLayoutChange}>
            <ToggleGroupItem value="table" className="gap-1">
              <List size={11} />
              Default
            </ToggleGroupItem>
            <ToggleGroupItem value="realm-grid" className="gap-1">
              <LayoutGrid size={11} />
              Compact
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="w-px h-4 bg-gray-700/60 mx-0.5" />

        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className={`relative flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${
            showFilters ? "bg-gray-700/80 text-gray-200" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
          }`}
        >
          <SlidersHorizontal size={11} />
          Filter
          {classFilter !== "all" && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            key="class-filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="inline-flex items-center rounded-lg bg-gray-800/60 p-0.5">
              <ToggleGroup value={classFilter} onValueChange={handleClassFilterChange}>
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="tank">Tank</ToggleGroupItem>
                <ToggleGroupItem value="caster">Caster</ToggleGroupItem>
                <ToggleGroupItem value="support">Support</ToggleGroupItem>
                <ToggleGroupItem value="stealth">Stealth</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (sortedCharacters.length === 0) {
    return (
      <div className="flex flex-col items-center w-full max-w-6xl">
        {toolbar}
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl">
      {toolbar}

      <div className="hidden sm:block w-full">
        <AnimatePresence mode="wait" initial={false}>
          {desktopLayout === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <TableContainer
                component={Paper}
                className="max-h-[60vh] lg:max-h-[70vh] xl:max-h-[75vh]"
                sx={tableContainerStyles}
              >
                <Table stickyHeader style={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <CharacterTableHeader
                      columnSort={columnSort}
                      columnSortDir={columnSortDir}
                      onColumnSort={handleColumnSort}
                    />
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
            </motion.div>
          )}
          {desktopLayout === "realm-grid" && (
            <motion.div
              key="realm-grid"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-h-[80vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/40 p-2"
            >
              <div className="grid grid-cols-3 gap-2">
                {REALMS.map((realm) => (
                  <div key={realm}>
                    <div className="sticky top-0 z-10 rounded border border-gray-800 bg-gray-900/95 px-2 py-0.5 text-center text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      {realm}
                    </div>
                    <div className="space-y-[2px]">
                      {charactersByRealm[realm].map((character) => (
                        <DesktopCharacterCard
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
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
