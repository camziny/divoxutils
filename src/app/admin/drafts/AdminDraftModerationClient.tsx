"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight } from "lucide-react";
import {
  CLASS_CATEGORIES,
  classesByRealm,
  REALMS,
  type ClassCategory,
} from "@/app/draft/constants";
import {
  analyzeFightEditor,
  createEmptyFightRow,
  toFightEditorRows,
  type FightEditorRow,
} from "./fightEditorUtils";

type ModerationPlayer = {
  _id: string;
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: 1 | 2;
  isCaptain: boolean;
  selectedClass?: string;
};

type ModerationFight = {
  fightNumber: number;
  winnerTeam: 1 | 2;
  classesByPlayer: Array<{
    playerId: string;
    discordUserId: string;
    className: string;
    substituteMode?: "known" | "manual";
    substituteDiscordUserId?: string;
    substituteDisplayName?: string;
    substituteAvatarUrl?: string;
  }>;
};

type ModerationDraft = {
  _id: string;
  shortId: string;
  discordGuildId: string;
  discordGuildName?: string;
  winnerTeam?: 1 | 2;
  team1FightWins: number;
  team2FightWins: number;
  setScore: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  resultStatus: "unverified" | "verified" | "voided";
  resultModeratedAt?: number;
  resultModeratedBy?: string;
  _creationTime: number;
  players: ModerationPlayer[];
  fights: ModerationFight[];
};

type CancelableDraft = {
  _id: string;
  shortId: string;
  status: "setup" | "coin_flip" | "realm_pick" | "banning" | "drafting" | "complete";
  gameStarted?: boolean;
  discordGuildId: string;
  discordGuildName?: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  teamSize: number;
  playerCount: number;
  assignedCount: number;
  captainCount: number;
  selectedClassCount: number;
  fightCount: number;
  minimumPlayers: number;
  hasEnoughPlayers: boolean;
  ageMinutes: number;
  isLikelyStale: boolean;
  _creationTime: number;
};

type Action = "verify" | "void" | "override_team_1" | "override_team_2";
type SortOrder = "newest" | "oldest";
type CancelableFilter = "all" | "stale" | "progress";
type ReviewedFilter = "all" | "verified" | "voided";

export default function AdminDraftModerationClient() {
  const [pendingDrafts, setPendingDrafts] = useState<ModerationDraft[]>([]);
  const [reviewedDrafts, setReviewedDrafts] = useState<ModerationDraft[]>([]);
  const [cancelableDrafts, setCancelableDrafts] = useState<CancelableDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const [noteByDraft, setNoteByDraft] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fightEditorByDraft, setFightEditorByDraft] = useState<Record<string, FightEditorRow[]>>({});
  const [activeFightByDraft, setActiveFightByDraft] = useState<Record<string, number>>({});
  const [activePlayerByDraft, setActivePlayerByDraft] = useState<Record<string, string | null>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [guildSearch, setGuildSearch] = useState("");
  const [cancelableFilter, setCancelableFilter] = useState<CancelableFilter>("all");
  const [reviewedFilter, setReviewedFilter] = useState<ReviewedFilter>("all");
  const [substituteSearchByDraft, setSubstituteSearchByDraft] = useState<Record<string, string>>({});
  const [substituteDropdownByDraft, setSubstituteDropdownByDraft] = useState<Record<string, boolean>>({});
  const [selectedKnownSubByDraft, setSelectedKnownSubByDraft] = useState<
    Record<string, { discordUserId: string; displayName: string; avatarUrl?: string } | null>
  >({});

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/drafts");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch drafts.");
      }
      const pending = Array.isArray(payload?.pendingDrafts) ? payload.pendingDrafts : [];
      const reviewed = Array.isArray(payload?.reviewedDrafts) ? payload.reviewedDrafts : [];
      const cancelable = Array.isArray(payload?.cancelableDrafts) ? payload.cancelableDrafts : [];
      setPendingDrafts(pending);
      setReviewedDrafts(reviewed);
      setCancelableDrafts(cancelable);

      const nextEditor: Record<string, FightEditorRow[]> = {};
      const nextActiveFight: Record<string, number> = {};
      const nextActivePlayer: Record<string, string | null> = {};
      for (const draft of [...pending, ...reviewed]) {
        const draftedPlayers = draft.players.filter(
          (player: ModerationPlayer) => player.team !== undefined
        );
        nextEditor[draft.shortId] = toFightEditorRows(draft);
        nextActiveFight[draft.shortId] = 0;
        nextActivePlayer[draft.shortId] = draftedPlayers[0]?._id ?? null;
      }
      setFightEditorByDraft(nextEditor);
      setActiveFightByDraft(nextActiveFight);
      setActivePlayerByDraft(nextActivePlayer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch drafts.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const moderateDraft = useCallback(
    async (shortId: string, action: Action) => {
      setActiveDraft(shortId);
      setError(null);
      setSuccessMessage(null);
      try {
        const response = await fetch("/api/admin/drafts/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortId,
            action,
            note: noteByDraft[shortId] || undefined,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to moderate draft.");
        }
        await loadDrafts();
        const actionLabel =
          action === "verify"
            ? "verified"
            : action === "void"
              ? "voided"
              : action === "override_team_1"
                ? "overridden to Team 1"
                : "overridden to Team 2";
        setSuccessMessage(`Draft ${shortId} marked as ${actionLabel}.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to moderate draft.";
        setError(message);
      } finally {
        setActiveDraft(null);
      }
    },
    [loadDrafts, noteByDraft]
  );

  const cancelDraft = useCallback(
    async (shortId: string) => {
      const confirmation = window.prompt(
        `Type ${shortId} to confirm cancellation for this draft.`
      );
      if (confirmation !== shortId) {
        return;
      }

      setActiveDraft(shortId);
      setError(null);
      setSuccessMessage(null);
      try {
        const response = await fetch("/api/admin/drafts/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortId,
            reason: noteByDraft[shortId] || undefined,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to cancel draft.");
        }
        await loadDrafts();
        setSuccessMessage(`Draft ${shortId} cancelled.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to cancel draft.";
        setError(message);
      } finally {
        setActiveDraft(null);
      }
    },
    [loadDrafts, noteByDraft]
  );

  const saveFights = useCallback(
    async (draft: ModerationDraft) => {
      const rows = fightEditorByDraft[draft.shortId] ?? [];
      const draftedPlayers = draft.players.filter((player) => player.team !== undefined);
      const analysis = analyzeFightEditor(rows, draftedPlayers);
      if (!analysis.isComplete) {
        if (analysis.firstIssue) {
          setActiveFightByDraft((current) => ({
            ...current,
            [draft.shortId]: Math.max(0, analysis.firstIssue!.fightIndex),
          }));
          setError(analysis.firstIssue.message);
        } else {
          setError("Fight data is incomplete.");
        }
        return;
      }
      setActiveDraft(draft.shortId);
      setError(null);
      setSuccessMessage(null);
      try {
        const fightsPayload = rows.map((row) => ({
          winnerTeam: row.winnerTeam as 1 | 2,
          classesByPlayer: draftedPlayers.map((player) => ({
            playerId: player._id,
            className: row.classesByPlayer[player._id],
            substituteMode: row.substitutesByPlayer[player._id]?.mode,
            substituteDiscordUserId:
              row.substitutesByPlayer[player._id]?.mode === "known"
                ? row.substitutesByPlayer[player._id]?.discordUserId
                : undefined,
            substituteDisplayName: row.substitutesByPlayer[player._id]?.displayName,
            substituteAvatarUrl:
              row.substitutesByPlayer[player._id]?.mode === "known"
                ? row.substitutesByPlayer[player._id]?.avatarUrl
                : undefined,
          })),
        }));
        const response = await fetch("/api/admin/drafts/fights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortId: draft.shortId,
            fights: fightsPayload,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to save fight data.");
        }
        await loadDrafts();
        setSuccessMessage(`Fight data saved for ${draft.shortId}.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save fight data.";
        setError(message);
      } finally {
        setActiveDraft(null);
      }
    },
    [fightEditorByDraft, loadDrafts]
  );

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  };

  const toggleCard = useCallback((key: string) => {
    setExpandedCards((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const guildSearchLower = guildSearch.trim().toLowerCase();

  const matchesGuild = useCallback(
    (guildId: string, guildName?: string) => {
      if (!guildSearchLower) return true;
      return (
        guildId.toLowerCase().includes(guildSearchLower) ||
        (guildName ?? "").toLowerCase().includes(guildSearchLower)
      );
    },
    [guildSearchLower]
  );

  const sortFn = useCallback(
    (a: { _creationTime: number }, b: { _creationTime: number }) =>
      sortOrder === "newest"
        ? b._creationTime - a._creationTime
        : a._creationTime - b._creationTime,
    [sortOrder]
  );

  const filteredCancelable = useMemo(() => {
    return cancelableDrafts
      .filter((d) => matchesGuild(d.discordGuildId, d.discordGuildName))
      .filter((d) => {
        if (cancelableFilter === "stale") return d.isLikelyStale;
        if (cancelableFilter === "progress") return !d.isLikelyStale;
        return true;
      })
      .sort(sortFn);
  }, [cancelableDrafts, matchesGuild, cancelableFilter, sortFn]);

  const filteredPending = useMemo(() => {
    return pendingDrafts
      .filter((d) => matchesGuild(d.discordGuildId, d.discordGuildName))
      .sort(sortFn);
  }, [pendingDrafts, matchesGuild, sortFn]);

  const filteredReviewed = useMemo(() => {
    return reviewedDrafts
      .filter((d) => matchesGuild(d.discordGuildId, d.discordGuildName))
      .filter((d) => {
        if (reviewedFilter === "verified") return d.resultStatus === "verified";
        if (reviewedFilter === "voided") return d.resultStatus === "voided";
        return true;
      })
      .sort(sortFn);
  }, [reviewedDrafts, matchesGuild, reviewedFilter, sortFn]);

  const knownPlayers = useMemo(() => {
    const byDiscordId = new Map<
      string,
      { discordUserId: string; displayName: string; avatarUrl?: string }
    >();
    for (const draft of [...pendingDrafts, ...reviewedDrafts]) {
      for (const player of draft.players) {
        if (player.discordUserId && player.displayName?.trim()) {
          byDiscordId.set(player.discordUserId, {
            discordUserId: player.discordUserId,
            displayName: player.displayName.trim(),
            avatarUrl: player.avatarUrl,
          });
        }
      }
    }
    return Array.from(byDiscordId.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [pendingDrafts, reviewedDrafts]);

  const hasAnyDraftData =
    pendingDrafts.length > 0 ||
    reviewedDrafts.length > 0 ||
    cancelableDrafts.length > 0;

  const renderDraft = (draft: ModerationDraft, reviewed: boolean) => {
    const cardKey = `${reviewed ? "reviewed" : "pending"}:${draft.shortId}`;
    const expanded = !!expandedCards[cardKey];
    const team1 = draft.players.filter((p) => p.team === 1);
    const team2 = draft.players.filter((p) => p.team === 2);
    const draftedPlayers = draft.players.filter((p) => p.team !== undefined);
    const isActive = activeDraft === draft.shortId;
    const editorRows = fightEditorByDraft[draft.shortId] ?? [];
    const team1Players = draftedPlayers.filter((player) => player.team === 1);
    const team2Players = draftedPlayers.filter((player) => player.team === 2);
    const analysis = analyzeFightEditor(editorRows, draftedPlayers);
    const editorComplete = analysis.isComplete;
    const { team1Wins, team2Wins } = analysis;
    const activeFightIndex = Math.min(
      activeFightByDraft[draft.shortId] ?? 0,
      Math.max(0, editorRows.length - 1)
    );
    const activeFight = editorRows[activeFightIndex];
    const selectedPlayerId = activePlayerByDraft[draft.shortId] ?? draftedPlayers[0]?._id ?? null;
    const selectedPlayer =
      draftedPlayers.find((player) => player._id === selectedPlayerId) ?? draftedPlayers[0] ?? null;
    const selectedPlayerTeam = selectedPlayer?.team ?? null;
    const selectedSubstitute =
      selectedPlayer && activeFight
        ? activeFight.substitutesByPlayer[selectedPlayer._id] ?? null
        : null;

    const cap1 = team1.find((p) => p.isCaptain);
    const cap2 = team2.find((p) => p.isCaptain);

    const substituteSearchQuery = (substituteSearchByDraft[draft.shortId] ?? "").toLowerCase();
    const substituteDropdownMatches =
      substituteDropdownByDraft[draft.shortId] && selectedPlayer
        ? knownPlayers
            .filter(
              (kp) =>
                kp.displayName.toLowerCase().includes(substituteSearchQuery) &&
                kp.discordUserId !== selectedPlayer.discordUserId
            )
            .slice(0, 8)
        : [];
    const typedSubstituteName = (substituteSearchByDraft[draft.shortId] ?? "").trim();
    const selectedKnownSub = selectedKnownSubByDraft[draft.shortId] ?? null;
    const exactKnownSubMatches =
      selectedPlayer && typedSubstituteName
        ? knownPlayers.filter(
            (kp) =>
              kp.displayName.toLowerCase() === typedSubstituteName.toLowerCase() &&
              kp.discordUserId !== selectedPlayer.discordUserId
          )
        : [];

    return (
      <div key={draft.shortId} className="rounded-lg border border-gray-800 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCard(cardKey)}
          className="w-full px-4 py-3 text-left hover:bg-gray-800/20 transition-colors duration-100 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <ChevronRight
                className={`w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform duration-150 ${
                  expanded ? "rotate-90" : ""
                }`}
              />
              <span className="text-sm font-medium text-gray-200 font-mono">{draft.shortId}</span>
              {cap1 && cap2 && (
                <span className="text-xs text-gray-500 truncate">
                  {cap1.displayName} vs {cap2.displayName}
                </span>
              )}
              <span className="shrink-0 text-[11px] text-gray-600">
                {draft.setScore || `${draft.team1FightWins}-${draft.team2FightWins}`}
              </span>
              {draft.winnerTeam && (
                <span className="shrink-0 text-[11px] text-gray-600">
                  · Team {draft.winnerTeam} won
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] text-gray-600">{draft.resultStatus}</span>
              <span className="text-[11px] text-gray-600">{formatTimestamp(draft._creationTime)}</span>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-800/60">
            <div className="pt-4 mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
              <span>
                Guild {draft.discordGuildName ? `${draft.discordGuildName} ` : ""}
                <span className="font-mono text-gray-400">({draft.discordGuildId})</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <AvatarChip
                  name={draft.createdByDisplayName ?? draft.createdBy}
                  avatarUrl={draft.createdByAvatarUrl}
                />
                <span>
                  Created by {draft.createdByDisplayName ? `${draft.createdByDisplayName} ` : ""}
                  <span className="font-mono text-gray-400">({draft.createdBy})</span>
                </span>
              </span>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <TeamPreview players={team1} title="Team 1" highlight={draft.winnerTeam === 1} />
              <TeamPreview players={team2} title="Team 2" highlight={draft.winnerTeam === 2} />
            </div>

            <div className="mb-4 rounded-md border border-gray-800 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-gray-400">Fight editor</div>
                <div className="inline-flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <span className="rounded border border-gray-700 bg-gray-900/60 px-2 py-1 tabular-nums">
                    Score {team1Wins}-{team2Wins}
                  </span>
                  <span className="rounded border border-gray-700 bg-gray-900/60 px-2 py-1">
                    {analysis.completedFightCount}/{editorRows.length} fights complete
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${
                      editorComplete
                        ? "border-indigo-500/40 text-indigo-300"
                        : "border-gray-700 text-gray-500"
                    }`}
                  >
                    {editorComplete && <Check className="h-3 w-3" />}
                    {editorComplete ? "Score valid" : "Score incomplete"}
                  </span>
                </div>
              </div>

              <div className="sticky top-2 z-10 -mx-3 mb-3 border-y border-gray-800 bg-gray-900/95 px-3 py-2 backdrop-blur">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-500">Set total fights</span>
                  <select
                    value={String(editorRows.length)}
                    onChange={(event) => {
                      const fightCount = Number(event.target.value);
                      setFightEditorByDraft((current) => {
                        const existing = current[draft.shortId] ?? [];
                        const lastRow = existing[existing.length - 1];
                        const nextRows: FightEditorRow[] = [];
                        for (let i = 0; i < fightCount; i += 1) {
                          if (existing[i]) {
                            nextRows.push(existing[i]);
                          } else {
                            nextRows.push({
                              winnerTeam: null,
                              classesByPlayer: lastRow
                                ? { ...lastRow.classesByPlayer }
                                : createEmptyFightRow(draftedPlayers).classesByPlayer,
                              substitutesByPlayer: lastRow
                                ? { ...lastRow.substitutesByPlayer }
                                : createEmptyFightRow(draftedPlayers).substitutesByPlayer,
                            });
                          }
                        }
                        return { ...current, [draft.shortId]: nextRows };
                      });
                      setActiveFightByDraft((current) => ({
                        ...current,
                        [draft.shortId]: Math.min(activeFightIndex, fightCount - 1),
                      }));
                    }}
                    className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-300"
                    disabled={isActive}
                  >
                    {[1, 2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-600">
                    Set must end at first-to-3 wins.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {editorRows.map((_, fightIndex) => {
                    const complete = analysis.rowCompleteness[fightIndex];
                    return (
                      <button
                        key={`${draft.shortId}-fight-tab-${fightIndex}`}
                        type="button"
                        onClick={() => {
                          setActiveFightByDraft((current) => ({
                            ...current,
                            [draft.shortId]: fightIndex,
                          }));
                          const nextFight = editorRows[fightIndex];
                          const subForPlayer =
                            selectedPlayer && nextFight
                              ? nextFight.substitutesByPlayer[selectedPlayer._id]
                              : null;
                          setSubstituteSearchByDraft((current) => ({
                            ...current,
                            [draft.shortId]: subForPlayer?.displayName ?? "",
                          }));
                          setSelectedKnownSubByDraft((current) => ({
                            ...current,
                            [draft.shortId]:
                              subForPlayer?.mode === "known" && subForPlayer.discordUserId
                                ? {
                                    discordUserId: subForPlayer.discordUserId,
                                    displayName: subForPlayer.displayName,
                                    avatarUrl: subForPlayer.avatarUrl,
                                  }
                                : null,
                          }));
                          setSubstituteDropdownByDraft((current) => ({
                            ...current,
                            [draft.shortId]: false,
                          }));
                        }}
                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors ${
                          activeFightIndex === fightIndex
                            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                            : "border-gray-700 text-gray-400 hover:text-gray-200"
                        }`}
                        disabled={isActive}
                      >
                        <span>Fight {fightIndex + 1}</span>
                        {complete ? (
                          <Check className="h-3 w-3 text-indigo-400" />
                        ) : (
                          <span className="rounded border border-gray-700 px-1 text-[10px] text-gray-500">
                            –
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFight ? (
                <div className="rounded border border-gray-800 px-3 py-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs text-gray-400">Fight {activeFightIndex + 1}</span>
                      {analysis.rowCompleteness[activeFightIndex] ? (
                        <span className="inline-flex items-center gap-1 rounded border border-indigo-500/40 px-1.5 py-0.5 text-[10px] text-indigo-300">
                          <Check className="h-2.5 w-2.5" />
                          Complete
                        </span>
                      ) : (
                        <span className="rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-500">
                          Incomplete
                        </span>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <span className="text-[11px] text-gray-500">Fight winner</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFightEditorByDraft((current) => ({
                            ...current,
                            [draft.shortId]: current[draft.shortId].map((row, idx) =>
                              idx === activeFightIndex ? { ...row, winnerTeam: 1 } : row
                            ),
                          }))
                        }
                        className={`rounded border px-2 py-1 text-xs transition-colors ${
                          activeFight.winnerTeam === 1
                            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                            : "border-gray-700 text-gray-400 hover:text-gray-200"
                        }`}
                        disabled={isActive}
                      >
                        Team 1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFightEditorByDraft((current) => ({
                            ...current,
                            [draft.shortId]: current[draft.shortId].map((row, idx) =>
                              idx === activeFightIndex ? { ...row, winnerTeam: 2 } : row
                            ),
                          }))
                        }
                        className={`rounded border px-2 py-1 text-xs transition-colors ${
                          activeFight.winnerTeam === 2
                            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                            : "border-gray-700 text-gray-400 hover:text-gray-200"
                        }`}
                        disabled={isActive}
                      >
                        Team 2
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { team: 1 as const, players: team1Players, border: "border-slate-500/40 bg-slate-900/20", title: "text-slate-200", classText: "text-slate-300/90" },
                      { team: 2 as const, players: team2Players, border: "border-indigo-500/40 bg-indigo-900/15", title: "text-indigo-200", classText: "text-indigo-300/90" },
                    ].map((group) => (
                      <div key={`${draft.shortId}-team-${group.team}`} className={`rounded border p-2.5 space-y-2 ${group.border}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium ${group.title}`}>Team {group.team}</p>
                          {activeFight.winnerTeam === group.team ? (
                            <span className="rounded border border-indigo-400/40 bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-200">
                              Winner
                            </span>
                          ) : (
                            <span className="rounded border border-transparent px-1.5 py-0.5 text-[10px] opacity-0">
                              Winner
                            </span>
                          )}
                        </div>
                        {group.players.map((player) => {
                          const isSelected = selectedPlayer?._id === player._id;
                          const currentClass = activeFight.classesByPlayer[player._id] ?? "";
                          const substitute = activeFight.substitutesByPlayer[player._id] ?? null;
                          return (
                            <button
                              type="button"
                              key={`${draft.shortId}-fight-${activeFightIndex}-pick-${player._id}`}
                              onClick={() => {
                                setActivePlayerByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: player._id,
                                }));
                                const existingSub = activeFight.substitutesByPlayer[player._id];
                                setSubstituteSearchByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: existingSub?.displayName ?? "",
                                }));
                                setSelectedKnownSubByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]:
                                    existingSub?.mode === "known" && existingSub.discordUserId
                                      ? {
                                          discordUserId: existingSub.discordUserId,
                                          displayName: existingSub.displayName,
                                          avatarUrl: existingSub.avatarUrl,
                                        }
                                      : null,
                                }));
                                setSubstituteDropdownByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: false,
                                }));
                              }}
                              className={`w-full grid grid-cols-[20px_1fr_72px] items-center gap-2 rounded border px-2 py-1.5 text-left transition-colors ${
                                isSelected
                                  ? group.team === 1
                                    ? "border-slate-300/60 bg-slate-700/20"
                                    : "border-indigo-400/60 bg-indigo-500/15"
                                  : group.team === 1
                                    ? "border-slate-500/30 bg-slate-900/20 hover:border-slate-400/60"
                                    : "border-indigo-500/30 bg-indigo-900/10 hover:border-indigo-400/60"
                              }`}
                              disabled={isActive}
                            >
                              <AvatarChip name={player.displayName} avatarUrl={player.avatarUrl} />
                              <span className="truncate text-xs text-gray-300">
                                {substitute?.displayName ? (
                                  <>
                                    {substitute.displayName}
                                  </>
                                ) : (
                                  <>
                                    {player.displayName}
                                    {player.isCaptain ? (
                                      <span className="ml-1 text-[10px] text-gray-600 uppercase tracking-wider">
                                        C
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </span>
                              <span className={`truncate text-[10px] ${group.classText}`}>
                                {currentClass || "No class"}
                                {substitute?.displayName ? " / Substitute active" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded border border-gray-700/50 p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">Selected:</span>
                      <span className="text-xs text-gray-200">
                        {selectedPlayer ? selectedPlayer.displayName : "None"}
                      </span>
                      {selectedPlayerTeam ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            selectedPlayerTeam === 1
                              ? "bg-slate-700/30 text-slate-200"
                              : "bg-indigo-500/20 text-indigo-200"
                          }`}
                        >
                          Team {selectedPlayerTeam}
                        </span>
                      ) : null}
                      {selectedPlayer ? (
                        <span className="text-xs text-indigo-300">
                          {activeFight.classesByPlayer[selectedPlayer._id] || "Class not set"}
                        </span>
                      ) : null}
                    </div>
                    {selectedPlayer ? (
                      <div className="rounded border border-gray-800/80 p-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-gray-500">
                            Substitute for {selectedPlayer.displayName}
                          </span>
                          {selectedSubstitute ? (
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] ${
                              selectedSubstitute.mode === "known"
                                ? "border-indigo-700/40 bg-indigo-900/20 text-indigo-300"
                                : "border-gray-700 bg-gray-800/40 text-gray-400"
                            }`}>
                              {selectedSubstitute.mode === "known" ? "linked" : "unlinked"}
                            </span>
                          ) : null}
                        </div>
                        <div className="relative">
                          <input
                            value={substituteSearchByDraft[draft.shortId] ?? ""}
                            onChange={(event) => {
                              const val = event.target.value;
                              setSubstituteSearchByDraft((current) => ({
                                ...current,
                                [draft.shortId]: val,
                              }));
                              setSelectedKnownSubByDraft((current) => ({
                                ...current,
                                [draft.shortId]: null,
                              }));
                              setSubstituteDropdownByDraft((current) => ({
                                ...current,
                                [draft.shortId]: val.length > 0,
                              }));
                            }}
                            onFocus={() => {
                              const val = substituteSearchByDraft[draft.shortId] ?? "";
                              if (val.length > 0) {
                                setSubstituteDropdownByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: true,
                                }));
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setSubstituteDropdownByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: false,
                                }));
                              }, 120);
                            }}
                            disabled={isActive}
                            placeholder="Search by name, or type a name to add manually..."
                            className="w-full rounded border border-gray-700 bg-transparent px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-gray-500 placeholder-gray-600"
                          />
                          {substituteDropdownMatches.length > 0 ? (
                            <ul className="absolute left-0 right-0 top-full z-20 mt-1 rounded border border-gray-700 bg-gray-900 py-1 shadow-lg">
                              {substituteDropdownMatches.map((kp) => (
                                <li key={kp.discordUserId}>
                                  <button
                                    type="button"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      setSubstituteSearchByDraft((current) => ({
                                        ...current,
                                        [draft.shortId]: kp.displayName,
                                      }));
                                      setSelectedKnownSubByDraft((current) => ({
                                        ...current,
                                        [draft.shortId]: {
                                          discordUserId: kp.discordUserId,
                                          displayName: kp.displayName,
                                          avatarUrl: kp.avatarUrl,
                                        },
                                      }));
                                      setSubstituteDropdownByDraft((current) => ({
                                        ...current,
                                        [draft.shortId]: false,
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-800 transition-colors"
                                  >
                                    {kp.displayName}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isActive || !typedSubstituteName}
                            onClick={() => {
                              const nextKnownSub =
                                selectedKnownSub &&
                                selectedKnownSub.displayName.toLowerCase() ===
                                  typedSubstituteName.toLowerCase()
                                  ? selectedKnownSub
                                  : exactKnownSubMatches.length === 1
                                    ? exactKnownSubMatches[0]
                                    : null;

                              setFightEditorByDraft((current) => ({
                                ...current,
                                [draft.shortId]: current[draft.shortId].map((row, idx) => {
                                  if (idx !== activeFightIndex) return row;
                                  return {
                                    ...row,
                                    substitutesByPlayer: {
                                      ...row.substitutesByPlayer,
                                      [selectedPlayer._id]: nextKnownSub
                                        ? {
                                            mode: "known",
                                            discordUserId: nextKnownSub.discordUserId,
                                            displayName: nextKnownSub.displayName,
                                            avatarUrl: nextKnownSub.avatarUrl,
                                          }
                                        : { mode: "manual", displayName: typedSubstituteName },
                                    },
                                  };
                                }),
                              }));
                              setSelectedKnownSubByDraft((current) => ({
                                ...current,
                                [draft.shortId]: nextKnownSub,
                              }));
                              setSubstituteSearchByDraft((current) => ({
                                ...current,
                                [draft.shortId]: nextKnownSub?.displayName ?? typedSubstituteName,
                              }));
                              setSubstituteDropdownByDraft((current) => ({
                                ...current,
                                [draft.shortId]: false,
                              }));
                            }}
                            className="rounded border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-200 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply substitute
                          </button>
                          {selectedSubstitute ? (
                            <button
                              type="button"
                              disabled={isActive}
                              onClick={() => {
                                setSubstituteSearchByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: "",
                                }));
                                setSelectedKnownSubByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: null,
                                }));
                                setSubstituteDropdownByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: false,
                                }));
                                setFightEditorByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: current[draft.shortId].map((row, idx) => {
                                    if (idx !== activeFightIndex) return row;
                                    return {
                                      ...row,
                                      substitutesByPlayer: {
                                        ...row.substitutesByPlayer,
                                        [selectedPlayer._id]: null,
                                      },
                                    };
                                  }),
                                }));
                              }}
                              className="rounded border border-gray-700 px-2.5 py-1 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
                            >
                              Remove substitute
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      {(Object.entries(CLASS_CATEGORIES) as [ClassCategory, string[]][]).map(
                        ([category, classes]) => {
                          const hasAny = REALMS.some((realm) =>
                            classes.some((className) =>
                              (classesByRealm[realm] || []).includes(className)
                            )
                          );
                          if (!hasAny) return null;
                          return (
                            <div key={`${draft.shortId}-${category}`} className="flex items-start gap-2">
                              <span className="w-16 shrink-0 pt-1.5 text-[10px] uppercase tracking-wider font-medium text-gray-500">
                                {category}
                              </span>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                {REALMS.map((realm) => {
                                  const realmClasses = classes
                                    .filter((className) =>
                                      (classesByRealm[realm] || []).includes(className)
                                    )
                                    .sort((a, b) => a.localeCompare(b));
                                  if (realmClasses.length === 0) return null;
                                  const groupBg =
                                    realm === "Albion"
                                      ? "bg-red-900/15"
                                      : realm === "Midgard"
                                        ? "bg-blue-900/15"
                                        : "bg-green-900/15";
                                  return (
                                    <div
                                      key={`${draft.shortId}-${category}-${realm}`}
                                      className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 ${groupBg}`}
                                    >
                                      {realmClasses.map((className) => {
                                        const isSelected =
                                          !!selectedPlayer &&
                                          activeFight.classesByPlayer[selectedPlayer._id] === className;
                                        return (
                                          <button
                                            key={`${draft.shortId}-${category}-${realm}-${className}`}
                                            type="button"
                                            disabled={isActive || !selectedPlayer}
                                            onClick={() =>
                                              selectedPlayer &&
                                              setFightEditorByDraft((current) => ({
                                                ...current,
                                                [draft.shortId]: current[draft.shortId].map((row, idx) => {
                                                  if (idx !== activeFightIndex) return row;
                                                  return {
                                                    ...row,
                                                    classesByPlayer: {
                                                      ...row.classesByPlayer,
                                                      [selectedPlayer._id]: className,
                                                    },
                                                  };
                                                }),
                                              }))
                                            }
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                                              isSelected
                                                ? "bg-gray-700/70 text-white"
                                                : isActive || !selectedPlayer
                                                  ? "text-gray-600"
                                                  : "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                                            }`}
                                          >
                                            {className}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveFights(draft)}
                  className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                  disabled={isActive || !editorComplete}
                >
                  Save Fight Data
                </button>
                {!editorComplete && (
                  <span className="self-center text-xs text-gray-500">
                    {analysis.firstIssue?.message ?? "Fill all classes and winners, then reach first-to-3 wins."}
                  </span>
                )}
              </div>
            </div>

            <textarea
              value={noteByDraft[draft.shortId] ?? ""}
              onChange={(event) =>
                setNoteByDraft((current) => ({
                  ...current,
                  [draft.shortId]: event.target.value,
                }))
              }
              placeholder="Note (optional)"
              className="mb-3 w-full resize-none rounded-md border border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none focus:border-gray-700 transition-colors"
              rows={2}
            />

            <div className="flex gap-2">
              {draft.resultStatus !== "verified" && (
                <button
                  onClick={() => cancelDraft(draft.shortId)}
                  disabled={isActive}
                  className="rounded-md border border-red-700/40 px-3 py-1.5 text-xs text-red-300 hover:border-red-600/50 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Draft
                </button>
              )}
              {draft.resultStatus !== "verified" ? (
                <button
                  onClick={() => moderateDraft(draft.shortId, "verify")}
                  disabled={isActive || !editorComplete}
                  className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify
                </button>
              ) : (
                <button
                  onClick={() => moderateDraft(draft.shortId, "void")}
                  disabled={isActive}
                  className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Voided
                </button>
              )}
              <button
                onClick={() => moderateDraft(draft.shortId, "override_team_1")}
                disabled={isActive}
                className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-700 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Override Team 1
              </button>
              <button
                onClick={() => moderateDraft(draft.shortId, "override_team_2")}
                disabled={isActive}
                className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-700 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Override Team 2
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Admin
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Draft Moderation</h1>
          <p className="mt-1 text-xs text-gray-500">
            {loading
              ? "Loading..."
              : `${pendingDrafts.length} awaiting review · ${reviewedDrafts.length} reviewed · ${cancelableDrafts.length} cancelable`}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={guildSearch}
            onChange={(e) => setGuildSearch(e.target.value)}
            placeholder="Filter by guild..."
            className="rounded-md border border-gray-800 bg-transparent px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors w-44"
          />
          <div className="flex items-center gap-1 rounded-md border border-gray-800 p-0.5">
            {(["newest", "oldest"] as SortOrder[]).map((order) => (
              <button
                key={order}
                type="button"
                onClick={() => setSortOrder(order)}
                className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                  sortOrder === order
                    ? "bg-gray-700 text-gray-200"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {order === "newest" ? "Newest first" : "Oldest first"}
              </button>
            ))}
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md border border-gray-800 px-3 py-2 text-xs text-gray-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-gray-800 bg-gray-900/40 px-3 py-2 text-xs text-gray-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : !hasAnyDraftData ? (
          <div className="rounded-md border border-gray-800 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No draft moderation data.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-gray-300">
                  Cancelable drafts
                  {filteredCancelable.length !== cancelableDrafts.length && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {filteredCancelable.length}/{cancelableDrafts.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1 rounded-md border border-gray-800 p-0.5">
                  {(["all", "stale", "progress"] as CancelableFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCancelableFilter(f)}
                      className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                        cancelableFilter === f
                          ? "bg-gray-700 text-gray-200"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {f === "all" ? "All" : f === "stale" ? "Likely stale" : "Has progress"}
                    </button>
                  ))}
                </div>
              </div>
              {filteredCancelable.length === 0 ? (
                <div className="rounded-md border border-gray-800 px-4 py-6">
                  <p className="text-xs text-gray-500">
                    {cancelableDrafts.length === 0 ? "No cancelable drafts." : "No drafts match this filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredCancelable.map((draft) => {
                    const isActive = activeDraft === draft.shortId;
                    const cardKey = `cancelable:${draft.shortId}`;
                    const expanded = !!expandedCards[cardKey];
                    return (
                      <div key={`cancel-${draft.shortId}`} className="rounded-lg border border-gray-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleCard(cardKey)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-800/20 transition-colors duration-100 group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ChevronRight
                                className={`w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform duration-150 ${
                                  expanded ? "rotate-90" : ""
                                }`}
                              />
                              <span className="font-mono text-sm font-medium text-gray-200">{draft.shortId}</span>
                              <span className="rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-500">
                                {draft.status}
                              </span>
                              {draft.isLikelyStale ? (
                                <span className="rounded border border-indigo-700/40 bg-indigo-900/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                                  likely stale
                                </span>
                              ) : (
                                <span className="rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-500">
                                  has progress
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-[11px] text-gray-600">
                              <span>
                                {Math.floor(draft.ageMinutes / 60)}h {draft.ageMinutes % 60}m old
                              </span>
                              <span>
                                {draft.playerCount}/{draft.minimumPlayers} players · {draft.assignedCount} assigned · {draft.fightCount} fights
                              </span>
                              <span>{formatTimestamp(draft._creationTime)}</span>
                            </div>
                          </div>
                        </button>

                        {expanded && (
                          <div className="px-4 pb-4 border-t border-gray-800/60">
                            <div className="pt-4 mb-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                              <span>
                                Guild {draft.discordGuildName ? `${draft.discordGuildName} ` : ""}
                                <span className="font-mono text-gray-400">({draft.discordGuildId})</span>
                              </span>
                              <span>
                                Created by {draft.createdByDisplayName ? `${draft.createdByDisplayName} ` : ""}
                                <span className="font-mono text-gray-400">({draft.createdBy})</span>
                              </span>
                              <span>
                                Captains {draft.captainCount}/2 · Classes {draft.selectedClassCount}
                              </span>
                            </div>
                            <textarea
                              value={noteByDraft[draft.shortId] ?? ""}
                              onChange={(event) =>
                                setNoteByDraft((current) => ({
                                  ...current,
                                  [draft.shortId]: event.target.value,
                                }))
                              }
                              placeholder="Cancellation note (optional)"
                              className="mb-3 w-full resize-none rounded-md border border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none focus:border-gray-700 transition-colors"
                              rows={2}
                            />
                            <button
                              type="button"
                              onClick={() => cancelDraft(draft.shortId)}
                              disabled={isActive}
                              className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel Draft
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-gray-300">
                  Pending drafts
                  {filteredPending.length !== pendingDrafts.length && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {filteredPending.length}/{pendingDrafts.length}
                    </span>
                  )}
                </h2>
              </div>
              {filteredPending.length === 0 ? (
                <div className="rounded-md border border-gray-800 px-4 py-6">
                  <p className="text-xs text-gray-500">
                    {pendingDrafts.length === 0 ? "No unverified drafts." : "No drafts match this filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredPending.map((draft) => renderDraft(draft, false))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-gray-300">
                  Reviewed drafts
                  {filteredReviewed.length !== reviewedDrafts.length && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {filteredReviewed.length}/{reviewedDrafts.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1 rounded-md border border-gray-800 p-0.5">
                  {(["all", "verified", "voided"] as ReviewedFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setReviewedFilter(f)}
                      className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                        reviewedFilter === f
                          ? "bg-gray-700 text-gray-200"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {filteredReviewed.length === 0 ? (
                <div className="rounded-md border border-gray-800 px-4 py-6">
                  <p className="text-xs text-gray-500">
                    {reviewedDrafts.length === 0 ? "No reviewed drafts yet." : "No drafts match this filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredReviewed.map((draft) => renderDraft(draft, true))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamPreview({
  title,
  players,
  highlight,
}: {
  title: string;
  players: ModerationPlayer[];
  highlight: boolean;
}) {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-indigo-500/40" : "border-gray-800"}`}>
      <div className={`mb-1.5 flex items-center gap-1.5 text-xs ${highlight ? "text-indigo-300" : "text-gray-500"}`}>
        {title}
        {highlight ? <Check className="h-3 w-3" /> : null}
      </div>
      <div className="space-y-0.5">
        {players.map((player) => (
          <div key={player.discordUserId} className="text-xs text-gray-300">
            <span className="inline-flex items-center gap-1.5">
              <AvatarChip name={player.displayName} avatarUrl={player.avatarUrl} />
              <span>
                {player.displayName}
                {player.isCaptain ? " (C)" : ""}
              </span>
            </span>
          </div>
        ))}
        {players.length === 0 && <div className="text-xs text-gray-600">No players</div>}
      </div>
    </div>
  );
}

function AvatarChip({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={16}
        height={16}
        className="h-4 w-4 rounded-full border border-gray-700 object-cover"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-[9px] text-gray-300">
      {initial}
    </span>
  );
}
