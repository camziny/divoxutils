"use client";
import React, { useState, useMemo, useCallback, memo, useTransition, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import CharacterTableHeader from "./CharacterTableHeader";
import CharacterListSkeleton from "@/app/user/_components/CharacterListSkeleton";
import { CharacterData } from "@/utils/character";
import { sortCharacters } from "@/utils/sortCharacters";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, LayoutGrid, List, ArrowDownWideNarrow, ArrowUpNarrowWide, Layers, SlidersHorizontal, Pin } from "lucide-react";
import { toast } from "sonner";
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
import {
  resolveInitialDesktopLayout,
  type DesktopLayout,
} from "@/utils/characterListLayout";
import {
  getDesktopLayoutLabel,
  shouldApplyRealmGridRankSort,
  shouldShowSaveLayoutHint,
} from "@/utils/characterListLayoutUi";
import CharacterStatsSectionSkeleton from "./CharacterStatsSectionSkeleton";

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
  loading: () => <CharacterStatsSectionSkeleton />,
});

type CharacterListProps = {
  characters: CharacterData[];
  searchParams: { [key: string]: string | string[] };
  showDelete?: boolean;
  userId?: string;
  preferredDesktopLayout?: DesktopLayout | null;
};

type LeaderboardRankItem = {
  userId: number;
  clerkUserId: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalKills: number;
  killsLastWeek: number;
  killsThisWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  soloKillsThisWeek: number;
  totalDeathBlows: number;
  deathBlowsLastWeek: number;
  deathBlowsThisWeek: number;
};

const DESKTOP_LAYOUTS: DesktopLayout[] = ["table", "realm-grid"];
const REALMS: Array<"Albion" | "Hibernia" | "Midgard"> = ["Albion", "Hibernia", "Midgard"];

const CharacterListOptimized: React.FC<CharacterListProps> = ({
  characters,
  searchParams,
  showDelete = true,
  userId,
  preferredDesktopLayout = null,
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
  const initialColumnSort = (() => {
    const value = searchParams?.columnSort;
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized || null;
  })();
  const initialColumnSortDir = (() => {
    const value = searchParams?.columnSortDir;
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === "desc" ? "desc" : "asc";
  })();
  const initialLayout = (() => {
    return resolveInitialDesktopLayout({
      searchParams,
      preferredDesktopLayout,
    });
  })();
  const [sortOption, setSortOption] = useState(initialSortOption);
  const [desktopLayout, setDesktopLayout] = useState<DesktopLayout>(initialLayout);
  const [savedPreference, setSavedPreference] = useState<DesktopLayout>(
    preferredDesktopLayout && DESKTOP_LAYOUTS.includes(preferredDesktopLayout)
      ? preferredDesktopLayout
      : "table"
  );
  const initialClassFilter = normalizeClassFilter(searchParams?.classFilter);
  const [classFilter, setClassFilter] = useState<ClassFilter>(initialClassFilter);
  const [columnSort, setColumnSort] = useState<string | null>(initialColumnSort);
  const [columnSortDir, setColumnSortDir] = useState<"asc" | "desc">(initialColumnSortDir);
  const [showFilters, setShowFilters] = useState(initialClassFilter !== "all");
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRankItem[]>([]);
  const deleteDialogRef = useRef<HTMLDivElement | null>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteSubmitButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const updateViewportState = () => setIsDesktopViewport(mediaQuery.matches);
    updateViewportState();
    mediaQuery.addEventListener("change", updateViewportState);
    return () => mediaQuery.removeEventListener("change", updateViewportState);
  }, []);

  useEffect(() => {
    if (!confirmDelete) return;

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      deleteCancelButtonRef.current?.focus();
    }, 0);

    const handleDialogKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmDelete(null);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [
        deleteCancelButtonRef.current,
        deleteSubmitButtonRef.current,
      ].filter((node): node is HTMLButtonElement => node !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeElement || activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeydown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleDialogKeydown);
      document.body.style.overflow = previousOverflow;
      previousFocusedElementRef.current?.focus();
    };
  }, [confirmDelete]);

  const filteredCharacters = useMemo(
    () => filterCharactersByClass(characters, classFilter),
    [characters, classFilter]
  );

  const effectiveSortKey = useMemo(
    () =>
      shouldApplyRealmGridRankSort({
        isDesktopViewport,
        desktopLayout,
        sortOption,
        columnSort,
      })
        ? "rank-high-to-low"
        : getEffectiveCharacterSortKey(sortOption, columnSort, columnSortDir),
    [isDesktopViewport, desktopLayout, sortOption, columnSort, columnSortDir]
  );

  const sortedCharacters = useMemo(
    () => sortCharacters([...filteredCharacters], effectiveSortKey),
    [filteredCharacters, effectiveSortKey]
  );
  const rankClerkUserId = useMemo(
    () => sortedCharacters[0]?.clerkUserId ?? null,
    [sortedCharacters]
  );

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadLeaderboardData = async () => {
      try {
        const response = await fetch("/api/leaderboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as LeaderboardRankItem[];
        if (isActive) {
          setLeaderboardData(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    };

    loadLeaderboardData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleSortChange = useCallback((option: string) => {
    if (!option) return;
    setSortOption(option);
    setColumnSort(null);
    setColumnSortDir("asc");
    const nextParams = new URLSearchParams(activeSearchParams?.toString() || "");
    nextParams.set("sortOption", option);
    nextParams.delete("columnSort");
    nextParams.delete("columnSortDir");
    router.replace(`${pathname}?${nextParams.toString()}`);
  }, [activeSearchParams, pathname, router]);

  const handleLayoutChange = useCallback(
    (value: string) => {
      if (!DESKTOP_LAYOUTS.includes(value as DesktopLayout)) return;
      const nextLayout = value as DesktopLayout;
      setDesktopLayout(nextLayout);
      const nextParams = new URLSearchParams(activeSearchParams?.toString() || "");
      nextParams.set("layout", nextLayout);
      router.replace(`${pathname}?${nextParams.toString()}`);
    },
    [activeSearchParams, pathname, router]
  );

  const handleSaveLayoutPreference = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch("/api/user/preferences/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: desktopLayout }),
      });
      if (!response.ok) {
        throw new Error("Could not save layout preference");
      }
      setSavedPreference(desktopLayout);
      toast.success(
        `${getDesktopLayoutLabel(desktopLayout)} is now your preferred layout`
      );
    } catch {
      toast.error("Could not save layout preference");
    }
  }, [desktopLayout, user?.id]);

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
      const nextParams = new URLSearchParams(activeSearchParams?.toString() || "");
      if (nextState.columnSort) {
        nextParams.set("columnSort", nextState.columnSort);
        nextParams.set("columnSortDir", nextState.columnSortDir);
      } else {
        nextParams.delete("columnSort");
        nextParams.delete("columnSortDir");
      }
      router.replace(`${pathname}?${nextParams.toString()}`);
    },
    [activeSearchParams, columnSort, columnSortDir, pathname, router]
  );

  const charactersByRealm = useMemo(() => {
    const grouped: Record<"Albion" | "Hibernia" | "Midgard", CharacterData[]> = {
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
        `/api/my-characters/${characterId}`,
        {
          method: "DELETE",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete the character.");
      }

      toast.success(`Successfully deleted ${characterName}`);

      startTransition(() => {
        router.refresh();
      });
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
        <p className="text-xs text-gray-400 text-center max-w-xs">
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
              Classic
            </ToggleGroupItem>
            <ToggleGroupItem value="realm-grid" className="gap-1">
              <LayoutGrid size={11} />
              Compact
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="w-px h-4 bg-gray-700/60 mx-0.5" />

        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-label="Toggle class filters"
          aria-expanded={showFilters}
          aria-controls="character-class-filters"
          className={`relative flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${
            showFilters ? "bg-gray-700/80 text-gray-200" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
          }`}
        >
          <SlidersHorizontal size={11} aria-hidden="true" />
          Filter
          {classFilter !== "all" && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            key="class-filters"
            id="character-class-filters"
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
        {shouldShowSaveLayoutHint({
          isSignedIn: Boolean(user?.id),
          desktopLayout,
          savedPreference,
        }) && (
          <motion.div
            key="save-layout-hint"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="hidden sm:block overflow-hidden"
          >
            <button
              type="button"
              onClick={handleSaveLayoutPreference}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-colors duration-150"
            >
              <Pin size={10} className="rotate-45" aria-hidden="true" />
              Set {getDesktopLayoutLabel(desktopLayout)} as your preferred layout
            </button>
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
              className="rounded-xl border border-gray-800 bg-gray-900/40 p-2 [@media(max-height:900px)]:max-h-[80vh] [@media(max-height:900px)]:overflow-y-auto"
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
        <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg shadow-lg max-w-sm">
          <span className="text-xs text-gray-300">{message}</span>
        </div>
      )}

      {isPending && (
        <div className="mt-4 p-3 text-center" role="status" aria-live="polite">
          <div className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-indigo-400" aria-hidden="true" />
            <span className="text-xs text-gray-400">Updating…</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AggregateStatistics
          characters={sortedCharacters}
          leaderboardData={leaderboardData}
          rankClerkUserId={rankClerkUserId}
        />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="delete-confirm-overlay">
          <div ref={deleteDialogRef} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description" className="bg-gray-900 border border-gray-800 rounded-xl max-w-sm w-full mx-4 overflow-hidden" data-testid="delete-confirm-modal">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 id="delete-confirm-title" className="text-sm font-medium text-gray-200">Delete Character</h3>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 flex-shrink-0 mt-0.5">
                  <AlertTriangle size={14} className="text-red-400" aria-hidden="true" />
                </div>
                <p id="delete-confirm-description" className="text-sm text-gray-300 leading-relaxed">
                  Are you sure you want to remove <span className="text-gray-200 font-medium">{confirmDelete.name}</span> from your list?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                type="button"
                ref={deleteCancelButtonRef}
                onClick={() => setConfirmDelete(null)}
                data-testid="delete-confirm-cancel"
                className="h-8 px-3 rounded-md text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
              >
                Cancel
              </button>
              <button
                type="button"
                ref={deleteSubmitButtonRef}
                onClick={confirmDeleteAction}
                data-testid="delete-confirm-submit"
                className="h-8 px-3 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
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
