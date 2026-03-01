"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type ModerationPlayer = {
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: 1 | 2;
  isCaptain: boolean;
};

type ModerationDraft = {
  _id: string;
  shortId: string;
  discordGuildId: string;
  discordGuildName?: string;
  winnerTeam?: 1 | 2;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  resultStatus: "unverified" | "verified" | "voided";
  resultModeratedAt?: number;
  resultModeratedBy?: string;
  _creationTime: number;
  players: ModerationPlayer[];
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

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/drafts");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to fetch drafts.");
      }
      setPendingDrafts(
        Array.isArray(payload?.pendingDrafts) ? payload.pendingDrafts : []
      );
      setReviewedDrafts(
        Array.isArray(payload?.reviewedDrafts) ? payload.reviewedDrafts : []
      );
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

  const moderateDraft = useCallback(async (shortId: string, action: Action) => {
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
  }, [loadDrafts, noteByDraft]);

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50"
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
        ) : pendingDrafts.length === 0 ? (
          <div className="rounded-md border border-gray-800 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No unverified drafts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDrafts.map((draft) => {
              const team1 = draft.players.filter((p) => p.team === 1);
              const team2 = draft.players.filter((p) => p.team === 2);
              const isActive = activeDraft === draft.shortId;

              return (
                <div
                  key={draft.shortId}
                  className="rounded-md border border-gray-800"
                >
                  <div className="px-4 py-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm font-medium text-gray-200">{draft.shortId}</span>
                        <span className="text-xs text-gray-600">unverified</span>
                        {draft.winnerTeam && (
                          <span className="text-xs text-gray-500">Winner: Team {draft.winnerTeam}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatTimestamp(draft._creationTime)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mb-4">
                      <span>Guild <span className="font-mono text-gray-400">{draft.discordGuildId}</span></span>
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

                    <div className="grid gap-3 sm:grid-cols-2 mb-4">
                      <div className={`rounded-md border p-3 ${draft.winnerTeam === 1 ? "border-emerald-900/60" : "border-gray-800"}`}>
                        <div className={`text-xs mb-1.5 ${draft.winnerTeam === 1 ? "text-emerald-500" : "text-gray-500"}`}>
                          Team 1{draft.winnerTeam === 1 ? " (W)" : ""}
                        </div>
                        <div className="space-y-0.5">
                          {team1.map((player) => (
                            <div key={player.discordUserId} className="text-xs text-gray-300">
                              <span className="inline-flex items-center gap-1.5">
                                <AvatarChip name={player.displayName} avatarUrl={player.avatarUrl} />
                                <span>{player.displayName}{player.isCaptain ? " (C)" : ""}</span>
                              </span>
                            </div>
                          ))}
                          {team1.length === 0 && <div className="text-xs text-gray-600">No players</div>}
                        </div>
                      </div>

                      <div className={`rounded-md border p-3 ${draft.winnerTeam === 2 ? "border-emerald-900/60" : "border-gray-800"}`}>
                        <div className={`text-xs mb-1.5 ${draft.winnerTeam === 2 ? "text-emerald-500" : "text-gray-500"}`}>
                          Team 2{draft.winnerTeam === 2 ? " (W)" : ""}
                        </div>
                        <div className="space-y-0.5">
                          {team2.map((player) => (
                            <div key={player.discordUserId} className="text-xs text-gray-300">
                              <span className="inline-flex items-center gap-1.5">
                                <AvatarChip name={player.displayName} avatarUrl={player.avatarUrl} />
                                <span>{player.displayName}{player.isCaptain ? " (C)" : ""}</span>
                              </span>
                            </div>
                          ))}
                          {team2.length === 0 && <div className="text-xs text-gray-600">No players</div>}
                        </div>
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
                      className="mb-3 w-full rounded-md border border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none focus:border-gray-700 transition-colors resize-none"
                      rows={2}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => moderateDraft(draft.shortId, "verify")}
                        disabled={isActive}
                        className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => moderateDraft(draft.shortId, "void")}
                        disabled={isActive}
                        className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Void
                      </button>
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
            })}
          </div>
        )}

        {!loading && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-gray-300 mb-3">
              Reviewed drafts (recent)
            </h2>
            {reviewedDrafts.length === 0 ? (
              <div className="rounded-md border border-gray-800 px-4 py-6">
                <p className="text-xs text-gray-500">No reviewed drafts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewedDrafts.map((draft) => {
                  const team1 = draft.players.filter((p) => p.team === 1);
                  const team2 = draft.players.filter((p) => p.team === 2);
                  const isActive = activeDraft === draft.shortId;
                  const isVerified = draft.resultStatus === "verified";
                  const reviewedAt = draft.resultModeratedAt ?? draft._creationTime;

                  return (
                    <div key={draft.shortId} className="rounded-md border border-gray-800">
                      <div className="px-4 py-4">
                        <div className="flex items-baseline justify-between mb-3">
                          <div className="flex items-baseline gap-3">
                            <span className="text-sm font-medium text-gray-200">{draft.shortId}</span>
                            <span className="text-xs text-gray-600">
                              {isVerified ? "verified" : "voided"}
                            </span>
                            {draft.winnerTeam && (
                              <span className="text-xs text-gray-500">Winner: Team {draft.winnerTeam}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-600">
                            {formatTimestamp(reviewedAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mb-4">
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
                          {draft.resultModeratedBy && (
                            <span>Reviewed by <span className="font-mono text-gray-400">{draft.resultModeratedBy}</span></span>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 mb-4">
                          <div className={`rounded-md border p-3 ${draft.winnerTeam === 1 ? "border-emerald-900/60" : "border-gray-800"}`}>
                            <div className={`text-xs mb-1.5 ${draft.winnerTeam === 1 ? "text-emerald-500" : "text-gray-500"}`}>
                              Team 1{draft.winnerTeam === 1 ? " (W)" : ""}
                            </div>
                            <div className="space-y-0.5">
                              {team1.map((player) => (
                                <div key={player.discordUserId} className="text-xs text-gray-300">
                                  <span className="inline-flex items-center gap-1.5">
                                    <AvatarChip name={player.displayName} avatarUrl={player.avatarUrl} />
                                    <span>{player.displayName}{player.isCaptain ? " (C)" : ""}</span>
                                  </span>
                                </div>
                              ))}
                              {team1.length === 0 && <div className="text-xs text-gray-600">No players</div>}
                            </div>
                          </div>

                          <div className={`rounded-md border p-3 ${draft.winnerTeam === 2 ? "border-emerald-900/60" : "border-gray-800"}`}>
                            <div className={`text-xs mb-1.5 ${draft.winnerTeam === 2 ? "text-emerald-500" : "text-gray-500"}`}>
                              Team 2{draft.winnerTeam === 2 ? " (W)" : ""}
                            </div>
                            <div className="space-y-0.5">
                              {team2.map((player) => (
                                <div key={player.discordUserId} className="text-xs text-gray-300">
                                  <span className="inline-flex items-center gap-1.5">
                                    <AvatarChip name={player.displayName} avatarUrl={player.avatarUrl} />
                                    <span>{player.displayName}{player.isCaptain ? " (C)" : ""}</span>
                                  </span>
                                </div>
                              ))}
                              {team2.length === 0 && <div className="text-xs text-gray-600">No players</div>}
                            </div>
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
                          className="mb-3 w-full rounded-md border border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none focus:border-gray-700 transition-colors resize-none"
                          rows={2}
                        />

                        <div className="flex gap-2">
                          {isVerified ? (
                            <button
                              onClick={() => moderateDraft(draft.shortId, "void")}
                              disabled={isActive}
                              className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Mark Voided
                            </button>
                          ) : (
                            <button
                              onClick={() => moderateDraft(draft.shortId, "verify")}
                              disabled={isActive}
                              className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Mark Verified
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
                })}
              </div>
            )}
          </div>
        )}
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
