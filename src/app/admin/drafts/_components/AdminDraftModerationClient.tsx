"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  CLASS_CATEGORIES,
  classesByRealm,
  REALMS,
  type ClassCategory,
} from "@/app/draft/_lib/constants";
import {
  analyzeFightEditor,
  createEmptyFightRow,
  toFightEditorRows,
} from "../_lib/fightEditorUtils";
import type { FightEditorRow } from "../_lib/fightEditorUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  Action,
  CancelableDraft,
  CancelableFilter,
  CancelledDraftEntry,
  ConfirmAction,
  ModerationDraft,
  ModerationPlayer,
  ReviewedFilter,
  SortOrder,
} from "../_lib/moderationTypes";

export default function AdminDraftModerationClient() {
  const [pendingDrafts, setPendingDrafts] = useState<ModerationDraft[]>([]);
  const [reviewedDrafts, setReviewedDrafts] = useState<ModerationDraft[]>([]);
  const [cancelableDrafts, setCancelableDrafts] = useState<CancelableDraft[]>([]);
  const [cancelledDrafts, setCancelledDrafts] = useState<CancelledDraftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceWarning, setMaintenanceWarning] = useState<string | null>(
    null
  );
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const [noteByDraft, setNoteByDraft] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fightEditorByDraft, setFightEditorByDraft] = useState<Record<string, FightEditorRow[]>>({});
  const [activeFightByDraft, setActiveFightByDraft] = useState<Record<string, number>>({});
  const [activePlayerByDraft, setActivePlayerByDraft] = useState<Record<string, string | null>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [showCancelledArchive, setShowCancelledArchive] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [guildSearch, setGuildSearch] = useState("");
  const [cancelableFilter, setCancelableFilter] = useState<CancelableFilter>("safe");
  const [reviewedFilter, setReviewedFilter] = useState<ReviewedFilter>("all");
  const [substituteSearchByDraft, setSubstituteSearchByDraft] = useState<Record<string, string>>({});
  const [substituteDropdownByDraft, setSubstituteDropdownByDraft] = useState<Record<string, boolean>>({});
  const [selectedKnownSubByDraft, setSelectedKnownSubByDraft] = useState<
    Record<string, { discordUserId: string; displayName: string; avatarUrl?: string } | null>
  >({});

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMaintenanceWarning(null);
    try {
      const response = await fetch("/api/admin/drafts");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch drafts.");
      }
      const pending = Array.isArray(payload?.pendingDrafts) ? payload.pendingDrafts : [];
      const reviewed = Array.isArray(payload?.reviewedDrafts) ? payload.reviewedDrafts : [];
      const cancelable = Array.isArray(payload?.cancelableDrafts) ? payload.cancelableDrafts : [];
      const cancelled = Array.isArray(payload?.cancelledDrafts) ? payload.cancelledDrafts : [];
      setPendingDrafts(pending);
      setReviewedDrafts(reviewed);
      setCancelableDrafts(cancelable);
      setCancelledDrafts(cancelled);
      if (typeof payload?.purgeWarning === "string") {
        setMaintenanceWarning(payload.purgeWarning);
      }

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

  const executeCancelDraft = useCallback(
    async (shortId: string) => {
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

  const openCancelConfirm = useCallback((shortId: string) => {
    setConfirmText("");
    setConfirmError(null);
    setConfirmAction({
      kind: "cancel",
      shortId,
      title: "Cancel draft",
      description:
        "This moves the draft to the cancelled archive for 90 days. Type the short ID to confirm.",
      confirmLabel: "Cancel Draft",
    });
  }, []);

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

  const executeRestoreDraft = useCallback(
    async (shortId: string) => {
      setActiveDraft(shortId);
      setError(null);
      setSuccessMessage(null);
      try {
        const response = await fetch("/api/admin/drafts/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortId }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to restore draft.");
        }
        await loadDrafts();
        const restoredStatus =
          typeof payload?.result?.status === "string" ? payload.result.status : null;
        setSuccessMessage(
          restoredStatus
            ? `Draft ${shortId} restored to ${restoredStatus}.`
            : `Draft ${shortId} restored.`
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to restore draft.";
        setError(message);
      } finally {
        setActiveDraft(null);
      }
    },
    [loadDrafts]
  );

  const openRestoreConfirm = useCallback((shortId: string) => {
    setConfirmText("");
    setConfirmError(null);
    setConfirmAction({
      kind: "restore",
      shortId,
      title: "Restore cancelled draft",
      description:
        "This restores the draft to its previous workflow state. Type the short ID to confirm.",
      confirmLabel: "Restore Draft",
    });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;
    if (confirmText.trim() !== confirmAction.shortId) {
      setConfirmError(`Confirmation must match ${confirmAction.shortId}.`);
      return;
    }
    const action = confirmAction;
    setConfirmError(null);
    setConfirmAction(null);
    setConfirmText("");
    if (action.kind === "cancel") {
      await executeCancelDraft(action.shortId);
    } else {
      await executeRestoreDraft(action.shortId);
    }
  }, [confirmAction, confirmText, executeCancelDraft, executeRestoreDraft]);

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatAge = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const toggleCard = useCallback((key: string) => {
    setExpandedCards((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const guildSearchLower = guildSearch.trim().toLowerCase();

  const matchesDraftQuery = useCallback(
    (draft: {
      shortId: string;
      discordGuildId: string;
      discordGuildName?: string;
      createdBy?: string;
      createdByDisplayName?: string;
    }) => {
      if (!guildSearchLower) return true;
      return (
        draft.shortId.toLowerCase().includes(guildSearchLower) ||
        draft.discordGuildId.toLowerCase().includes(guildSearchLower) ||
        (draft.discordGuildName ?? "").toLowerCase().includes(guildSearchLower) ||
        (draft.createdBy ?? "").toLowerCase().includes(guildSearchLower) ||
        (draft.createdByDisplayName ?? "").toLowerCase().includes(guildSearchLower)
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
      .filter((d) => matchesDraftQuery(d))
      .filter((d) => {
        if (cancelableFilter === "safe") return d.cancelConfidence === "safe";
        if (cancelableFilter === "probably_abandoned")
          return d.cancelConfidence === "probably_abandoned";
        return true;
      });
  }, [cancelableDrafts, matchesDraftQuery, cancelableFilter]);

  const cancelableCounts = useMemo(() => {
    const guild = cancelableDrafts.filter((d) => matchesDraftQuery(d));
    return {
      safe: guild.filter((d) => d.cancelConfidence === "safe").length,
      probably_abandoned: guild.filter(
        (d) => d.cancelConfidence === "probably_abandoned"
      ).length,
      needs_review: guild.filter((d) => d.cancelConfidence === "needs_review")
        .length,
      total: guild.length,
    };
  }, [cancelableDrafts, matchesDraftQuery]);

  const filteredPending = useMemo(() => {
    return pendingDrafts
      .filter((d) => matchesDraftQuery(d))
      .sort(sortFn);
  }, [pendingDrafts, matchesDraftQuery, sortFn]);

  const filteredReviewed = useMemo(() => {
    return reviewedDrafts
      .filter((d) => matchesDraftQuery(d))
      .filter((d) => {
        if (reviewedFilter === "verified") return d.resultStatus === "verified";
        if (reviewedFilter === "voided") return d.resultStatus === "voided";
        return true;
      })
      .sort(sortFn);
  }, [reviewedDrafts, matchesDraftQuery, reviewedFilter, sortFn]);

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
    cancelableDrafts.length > 0 ||
    cancelledDrafts.length > 0;

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
                  onClick={() => openCancelConfirm(draft.shortId)}
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
              : `${pendingDrafts.length} awaiting review · ${reviewedDrafts.length} reviewed · ${cancelableDrafts.length} cancelable · ${cancelledDrafts.length} archived`}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={guildSearch}
            onChange={(e) => setGuildSearch(e.target.value)}
            placeholder="Filter by guild, creator, or short ID..."
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
        {maintenanceWarning && (
          <div className="mb-4 rounded-md border border-gray-800 bg-gray-900/40 px-3 py-2 text-xs text-gray-400">
            {maintenanceWarning}
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
              <div className="mb-2">
                <h2 className="text-sm font-medium text-gray-300">
                  Stale Draft Cleanup
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {cancelableCounts.total === 0
                    ? "No stale drafts to clean up."
                    : `${cancelableCounts.safe} safe to cancel · ${cancelableCounts.probably_abandoned} probably abandoned · ${cancelableCounts.needs_review} need review`}
                </p>
              </div>

              <div className="mb-3 flex items-center gap-1 rounded-md border border-gray-800 p-0.5 w-fit">
                {(
                  [
                    { key: "safe" as const, label: "Safe to cancel", count: cancelableCounts.safe },
                    { key: "probably_abandoned" as const, label: "Probably abandoned", count: cancelableCounts.probably_abandoned },
                    { key: "all" as const, label: "All", count: cancelableCounts.total },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCancelableFilter(f.key)}
                    className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                      cancelableFilter === f.key
                        ? "bg-gray-700 text-gray-200"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {f.label}
                    {f.count > 0 && (
                      <span className="ml-1.5 tabular-nums">{f.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {filteredCancelable.length === 0 ? (
                <div className="rounded-md border border-gray-800 px-4 py-6">
                  <p className="text-xs text-gray-500">
                    {cancelableCounts.total === 0
                      ? "Nothing to clean up."
                      : cancelableFilter === "safe"
                        ? "No drafts are confidently safe to cancel right now."
                        : "No drafts in this category."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCancelable.map((draft) => {
                    const isActive = activeDraft === draft.shortId;
                    const isSafe = draft.cancelConfidence === "safe";
                    const isProbablyAbandoned =
                      draft.cancelConfidence === "probably_abandoned";

                    const badgeLabel = isSafe
                      ? "Safe to cancel"
                      : isProbablyAbandoned
                        ? "Probably abandoned"
                        : "Has activity";

                    return (
                      <div
                        key={`cancel-${draft.shortId}`}
                        className="rounded-lg border border-gray-800 p-4"
                      >
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-sm font-medium text-gray-200">
                            {draft.shortId}
                          </span>
                          <span
                            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                              isSafe
                                ? "border-indigo-700/50 bg-indigo-900/20 text-indigo-300"
                                : isProbablyAbandoned
                                  ? "border-gray-600 bg-gray-800/60 text-gray-400"
                                  : "border-gray-700 bg-gray-800/40 text-gray-500"
                            }`}
                          >
                            {badgeLabel}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {formatAge(draft.ageMinutes)} old
                          </span>
                        </div>

                        <DraftFlowIndicator status={draft.status} />

                        <div className="mt-2.5 space-y-1">
                          {draft.cancelReasons.map((reason, i) => (
                            <p key={i} className="text-xs text-gray-400">
                              {reason}
                            </p>
                          ))}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
                          <span>
                            {draft.playerCount}/{draft.minimumPlayers} players
                          </span>
                          <span>{draft.assignedCount} on teams</span>
                          <span>{draft.captainCount}/2 captains</span>
                          <span>{draft.selectedClassCount} classes picked</span>
                          <span>{draft.fightCount} fights</span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
                          {draft.discordGuildName && (
                            <span>{draft.discordGuildName}</span>
                          )}
                          {draft.createdByDisplayName && (
                            <span>Created by {draft.createdByDisplayName}</span>
                          )}
                          <span>{formatTimestamp(draft._creationTime)}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => openCancelConfirm(draft.shortId)}
                            disabled={isActive}
                            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-red-800/60 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel Draft
                          </button>
                        </div>
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

            {cancelledDrafts.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setShowCancelledArchive((v) => !v)}
                  className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showCancelledArchive ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  Cancelled archive (last 90 days)
                  <span className="text-xs font-normal text-gray-600">
                    {cancelledDrafts.length}
                  </span>
                </button>
                {showCancelledArchive && (
                  <div className="space-y-1 rounded-md border border-gray-800/60 p-3">
                    {cancelledDrafts.map((entry) => {
                      const ago = Math.floor(
                        (Date.now() - entry.cancelledAt) / 60000
                      );
                      const agoLabel =
                        ago < 1
                          ? "just now"
                          : `${formatAge(ago)} ago`;
                      return (
                        <div
                          key={`cancelled-${entry.shortId}-${entry.cancelledAt}`}
                          className="flex items-center justify-between gap-3 rounded px-2 py-1.5 text-xs text-gray-500"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="font-mono text-gray-400">
                              {entry.shortId}
                            </span>
                            <span>
                              {entry.playerCount} players
                            </span>
                            <span>· {entry.fightCount} fights</span>
                            {entry.discordGuildName && (
                              <span>· {entry.discordGuildName}</span>
                            )}
                            {entry.createdByDisplayName && (
                              <span>· by {entry.createdByDisplayName}</span>
                            )}
                            {entry.cancelReason && (
                              <span>· {entry.cancelReason}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-gray-600">{agoLabel}</span>
                            <button
                              type="button"
                              onClick={() => openRestoreConfirm(entry.shortId)}
                              disabled={activeDraft === entry.shortId}
                              className="rounded border border-gray-700 px-2 py-1 text-[11px] text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Restore
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <p className="mt-1 px-2 text-[11px] text-gray-600">
                      Archive keeps cancelled drafts for 90 days.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        <Dialog
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
              setConfirmText("");
              setConfirmError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmAction?.title}</DialogTitle>
              <DialogDescription>{confirmAction?.description}</DialogDescription>
            </DialogHeader>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-400">
                Type <span className="font-mono text-gray-200">{confirmAction?.shortId}</span> to continue.
              </p>
              <Input
                value={confirmText}
                onChange={(event) => {
                  setConfirmText(event.target.value);
                  if (confirmError) setConfirmError(null);
                }}
                placeholder={confirmAction?.shortId ?? ""}
              />
              {confirmError && (
                <p className="text-xs text-red-400">{confirmError}</p>
              )}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setConfirmText("");
                  setConfirmError(null);
                }}
                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-500"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500"
              >
                {confirmAction?.confirmLabel ?? "Confirm"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

const DRAFT_STAGES = [
  { key: "setup", label: "Setup" },
  { key: "coin_flip", label: "Coin flip" },
  { key: "realm_pick", label: "Realm pick" },
  { key: "banning", label: "Banning" },
  { key: "drafting", label: "Drafting" },
] as const;

function DraftFlowIndicator({ status }: { status: string }) {
  const currentIndex = DRAFT_STAGES.findIndex((s) => s.key === status);
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {DRAFT_STAGES.map((stage, i) => {
        const isReached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage.key} className="flex items-center gap-0.5">
            {i > 0 && (
              <span
                className={`mx-0.5 text-[10px] ${isReached ? "text-gray-500" : "text-gray-700"}`}
              >
                &rarr;
              </span>
            )}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                isCurrent
                  ? "bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 font-medium"
                  : isReached
                    ? "text-gray-400"
                    : "text-gray-700"
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
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
