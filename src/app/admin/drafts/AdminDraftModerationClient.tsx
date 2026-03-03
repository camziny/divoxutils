"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
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

type Action = "verify" | "void" | "override_team_1" | "override_team_2";

export default function AdminDraftModerationClient() {
  const [pendingDrafts, setPendingDrafts] = useState<ModerationDraft[]>([]);
  const [reviewedDrafts, setReviewedDrafts] = useState<ModerationDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const [noteByDraft, setNoteByDraft] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fightEditorByDraft, setFightEditorByDraft] = useState<
    Record<string, FightEditorRow[]>
  >({});
  const [activeFightByDraft, setActiveFightByDraft] = useState<Record<string, number>>({});
  const [activePlayerByDraft, setActivePlayerByDraft] = useState<
    Record<string, string | null>
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
      setPendingDrafts(pending);
      setReviewedDrafts(reviewed);

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

  const allDrafts = useMemo(
    () => [...pendingDrafts, ...reviewedDrafts],
    [pendingDrafts, reviewedDrafts]
  );

  const renderDraft = (draft: ModerationDraft, reviewed: boolean) => {
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

    return (
      <div key={draft.shortId} className="rounded-md border border-gray-800">
        <div className="px-4 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-gray-200">{draft.shortId}</span>
              <span className="text-xs text-gray-600">{draft.resultStatus}</span>
              <span className="text-xs text-gray-500">
                Set {draft.setScore || `${draft.team1FightWins}-${draft.team2FightWins}`}
              </span>
              {draft.winnerTeam && (
                <span className="text-xs text-gray-500">Winner: Team {draft.winnerTeam}</span>
              )}
            </div>
            <span className="text-xs text-gray-600">
              {formatTimestamp(reviewed ? draft.resultModeratedAt ?? draft._creationTime : draft._creationTime)}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
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
                      onClick={() =>
                        setActiveFightByDraft((current) => ({
                          ...current,
                          [draft.shortId]: fightIndex,
                        }))
                      }
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
                        return (
                          <button
                            type="button"
                            key={`${draft.shortId}-fight-${activeFightIndex}-pick-${player._id}`}
                            onClick={() =>
                              setActivePlayerByDraft((current) => ({
                                ...current,
                                [draft.shortId]: player._id,
                              }))
                            }
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
                              {player.displayName}
                              {player.isCaptain ? (
                                <span className="ml-1 text-[10px] text-gray-600 uppercase tracking-wider">
                                  C
                                </span>
                              ) : null}
                            </span>
                            <span className={`truncate text-[10px] ${group.classText}`}>
                              {currentClass || "No class"}
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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Draft Moderation</h1>
            <p className="mt-1 text-xs text-gray-500">
              {loading
                ? "Loading..."
                : `${pendingDrafts.length} awaiting review · ${reviewedDrafts.length} reviewed`}
            </p>
          </div>
          <button
            onClick={loadDrafts}
            className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300 disabled:opacity-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md border border-gray-800 px-3 py-2 text-xs text-gray-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-gray-800 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : allDrafts.length === 0 ? (
          <div className="rounded-md border border-gray-800 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No draft moderation data.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-300">Pending drafts</h2>
              {pendingDrafts.length === 0 ? (
                <div className="rounded-md border border-gray-800 px-4 py-6">
                  <p className="text-xs text-gray-500">No unverified drafts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDrafts.map((draft) => renderDraft(draft, false))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-300">Reviewed drafts</h2>
              {reviewedDrafts.length === 0 ? (
                <div className="rounded-md border border-gray-800 px-4 py-6">
                  <p className="text-xs text-gray-500">No reviewed drafts yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewedDrafts.map((draft) => renderDraft(draft, true))}
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
