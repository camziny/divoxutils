"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DraftData } from "@/app/draft/_lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Search, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import useDebounce from "./useDebounce";

type CombinedResult = {
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  username?: string;
};

export function useManagePlayers(draft: DraftData, token: string) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [discordResults, setDiscordResults] = useState<CombinedResult[] | null>(null);
  const [discordSearching, setDiscordSearching] = useState(false);
  const [discordSearchError, setDiscordSearchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<Id<"draftPlayers"> | null>(null);

  const debouncedSearchText = useDebounce(searchText, 300);
  const trimmedSearchText = debouncedSearchText.trim();
  const discordSearchRequestIdRef = useRef(0);

  const historyResults = useQuery(
    api.drafts.searchKnownPlayers,
    trimmedSearchText.length > 0
      ? { draftId: draft._id, callerToken: token, queryText: trimmedSearchText }
      : "skip"
  );

  const addDraftPlayer = useMutation(api.drafts.addDraftPlayer);
  const removeDraftPlayer = useMutation(api.drafts.removeDraftPlayer);
  const searchDiscordGuildMembers = useAction(api.drafts.searchDiscordGuildMembers);

  useEffect(() => {
    if (trimmedSearchText.length === 0) {
      discordSearchRequestIdRef.current += 1;
      setDiscordResults(null);
      setDiscordSearchError(null);
      return;
    }
    const requestId = (discordSearchRequestIdRef.current += 1);
    setDiscordSearching(true);
    setDiscordSearchError(null);
    searchDiscordGuildMembers({
      draftId: draft._id,
      callerToken: token,
      queryText: trimmedSearchText,
    })
      .then((results) => {
        if (discordSearchRequestIdRef.current === requestId) {
          setDiscordResults(
            results.map((result) => ({
              ...result,
              avatarUrl: result.avatarUrl ?? undefined,
            }))
          );
        }
      })
      .catch((e) => {
        if (discordSearchRequestIdRef.current === requestId) {
          console.error("Discord search failed", e);
          setDiscordSearchError("Discord search is unavailable right now");
          setDiscordResults(null);
        }
      })
      .finally(() => {
        if (discordSearchRequestIdRef.current === requestId) setDiscordSearching(false);
      });
  }, [trimmedSearchText, draft._id, token, searchDiscordGuildMembers]);

  const historyLoading = trimmedSearchText.length > 0 && historyResults === undefined;
  const combinedResults: CombinedResult[] = (() => {
    const seen = new Set<string>();
    const combined: CombinedResult[] = [];
    for (const result of historyResults ?? []) {
      seen.add(result.discordUserId);
      combined.push(result);
    }
    for (const result of discordResults ?? []) {
      if (seen.has(result.discordUserId)) continue;
      seen.add(result.discordUserId);
      combined.push({
        discordUserId: result.discordUserId,
        displayName: result.displayName,
        avatarUrl: result.avatarUrl ?? undefined,
        username: result.username,
      });
    }
    return combined;
  })();

  const handleAdd = async (input: CombinedResult) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await addDraftPlayer({
        draftId: draft._id,
        callerToken: token,
        discordUserId: input.discordUserId,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      });
      toast.success(`${input.displayName} added to the pool`);
      setSearchText("");
      discordSearchRequestIdRef.current += 1;
      setDiscordResults(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add player");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (playerId: Id<"draftPlayers">) => {
    if (removingId) return;
    setRemovingId(playerId);
    setError(null);
    try {
      await removeDraftPlayer({
        draftId: draft._id,
        callerToken: token,
        draftPlayerId: playerId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove player");
    } finally {
      setRemovingId(null);
    }
  };

  const removablePlayers = draft.players.filter(
    (p) => p.discordUserId !== draft.createdBy
  );

  return {
    open,
    setOpen,
    busy,
    error,
    searchText,
    setSearchText,
    trimmedSearchText,
    combinedResults,
    historyLoading,
    discordSearching,
    discordSearchError,
    removingId,
    removablePlayers,
    playerCount: draft.players.length,
    handleAdd,
    handleRemove,
  };
}

export type ManagePlayersState = ReturnType<typeof useManagePlayers>;

export function ManagePlayersTrigger({ open, setOpen }: ManagePlayersState) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen((o) => !o)}
      className={cn("gap-1.5", open && "border-gray-500 bg-gray-800")}
    >
      <UserPlus size={12} />
      {open ? "Hide manage players" : "Manage players"}
    </Button>
  );
}

export function ManagePlayersBody({
  busy,
  error,
  searchText,
  setSearchText,
  trimmedSearchText,
  combinedResults,
  historyLoading,
  discordSearching,
  discordSearchError,
  removingId,
  removablePlayers,
  playerCount,
  handleAdd,
  handleRemove,
}: ManagePlayersState) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-4 space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <Input
            placeholder="Search by name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8"
            disabled={busy}
          />
        </div>

        {trimmedSearchText.length > 0 && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-800">
            {historyLoading && combinedResults.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={14} className="animate-spin text-gray-500" />
                <span className="text-xs text-gray-500">Searching...</span>
              </div>
            ) : combinedResults.length === 0 && !discordSearching ? (
              <div className="py-4 text-center">
                <p className="text-xs text-gray-500">
                  {discordSearchError ?? "No matches"}
                </p>
              </div>
            ) : (
              <>
                {combinedResults.map((result) => (
                  <button
                    key={result.discordUserId}
                    type="button"
                    disabled={busy}
                    onClick={() => handleAdd(result)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-800/70 transition-colors border-b border-gray-800/60 last:border-b-0 disabled:opacity-50"
                  >
                    <Avatar src={result.avatarUrl} name={result.displayName} size={24} />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-200 truncate">
                        {result.displayName}
                      </div>
                      {result.username && (
                        <div className="text-[11px] text-gray-500 truncate">
                          @{result.username}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                {discordSearching && (
                  <div className="flex items-center justify-center gap-2 py-2 border-t border-gray-800/60">
                    <Loader2 size={12} className="animate-spin text-gray-500" />
                    <span className="text-[11px] text-gray-500">Searching Discord...</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {removablePlayers.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
            Current pool ({playerCount})
          </p>
          <div className="space-y-1">
            {removablePlayers.map((player) => (
              <div
                key={player._id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-gray-900/40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={player.avatarUrl} name={player.displayName} size={20} />
                  <span className="text-xs text-gray-300 truncate">{player.displayName}</span>
                </div>
                <button
                  type="button"
                  disabled={removingId === player._id}
                  onClick={() => handleRemove(player._id)}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-rose-400 transition-colors disabled:opacity-50"
                >
                  {removingId === player._id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <UserMinus size={11} />
                  )}
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
