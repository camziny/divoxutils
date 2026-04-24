"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DraftData, CurrentPlayer } from "@/app/draft/_lib/types";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  REALMS,
  classesByRealm,
  allClasses,
  CLASS_CATEGORIES,
  ClassCategory,
  toCanonicalDraftClassName,
} from "../../_lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DiscordIdentityLinkCard from "@/app/draft-history/_components/DiscordIdentityLinkCard";
import { getPlayerPoolEmptyState } from "./playerPoolState";
import {
  getFightSetupMaxViewFightIndex,
  getMaxSelectableTeamSize,
  isTeamSizeSelectable,
  toUserSettingsError,
} from "./settingsUtils";
import { splitBansForLiveSummary } from "./banSummary";
import { Ban, Check, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck } from "lucide-react";
import PlayerAvatar from "./PlayerAvatar";
import {
  getRealmChipBackground,
  REALM_CLASS_COLORS,
  realmsForClass,
} from "./draftClassRealmStyles";

interface DraftBoardProps {
  draft: DraftData;
  currentPlayer: CurrentPlayer | null;
  isCreator: boolean;
  token?: string;
}

type PickOrderMode = "snake" | "alternating";
type BanTimingMode = "before_picks" | "after_2_picks" | "after_3_picks" | "after_4_picks";
type HighestRankByClassEntry = {
  rank: number;
  formattedRank: string;
};

type LinkedProfileSummary = {
  profileName: string;
  characterListUrl: string;
  highestRankByClass: Record<string, HighestRankByClassEntry>;
  highestRankByClassRealm: Record<string, HighestRankByClassEntry>;
};

export default function DraftBoard({
  draft,
  currentPlayer,
  isCreator,
  token,
}: DraftBoardProps) {
  const assignCaptain = useMutation(api.drafts.assignCaptain);
  const updateSettings = useMutation(api.drafts.updateSettings);
  const startDraft = useMutation(api.drafts.startDraft);
  const setCoinFlipChoice = useMutation(api.drafts.setCoinFlipChoice);
  const pickRealm = useMutation(api.drafts.pickRealm);
  const banClass = useMutation(api.drafts.banClass);
  const toggleAutoBanClass = useMutation(api.drafts.toggleAutoBanClass);
  const toggleSafeClass = useMutation(api.drafts.toggleSafeClass);
  const pickPlayer = useMutation(api.drafts.pickPlayer);
  const setPlayerClass = useMutation(api.drafts.setPlayerClass);
  const recordFightResult = useMutation(api.drafts.recordFightResult);
  const updateFightWinner = useMutation(api.drafts.updateFightWinner);
  const finalizeSetResult = useMutation(api.drafts.finalizeSetResult);
  const beginGame = useMutation(api.drafts.beginGame);
  const undoLastAction = useMutation(api.drafts.undoLastAction);
  const cancelDraftByCreator = useMutation(api.drafts.cancelDraftByCreator);

  const [busy, setBusy] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [autoAdjustedSettingsKey, setAutoAdjustedSettingsKey] = useState<string | null>(null);
  const [linkedProfiles, setLinkedProfiles] = useState<Record<string, LinkedProfileSummary>>(
    {}
  );
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelConfirmationText, setCancelConfirmationText] = useState("");


  const team1Captain = draft.players.find(
    (p) => p.discordUserId === draft.team1CaptainId
  );
  const team2Captain = draft.players.find(
    (p) => p.discordUserId === draft.team2CaptainId
  );
  const team1Players = draft.players
    .filter((p) => p.team === 1 && !p.isCaptain)
    .sort((a, b) => (a.pickOrder ?? 0) - (b.pickOrder ?? 0));
  const team2Players = draft.players
    .filter((p) => p.team === 2 && !p.isCaptain)
    .sort((a, b) => (a.pickOrder ?? 0) - (b.pickOrder ?? 0));
  const availablePlayers = draft.players.filter(
    (p) => p.team === undefined && !p.isCaptain
  );
  const draftedPlayers = draft.players.filter((p) => p.team !== undefined);
  const draftedDiscordUserIds = useMemo(
    () =>
      draftedPlayers
        .map((player) => player.discordUserId)
        .sort((a, b) => a.localeCompare(b)),
    [draftedPlayers]
  );
  const draftedDiscordUserIdsCsv = useMemo(
    () => draftedDiscordUserIds.join(","),
    [draftedDiscordUserIds]
  );
  const draftedProfilesFetchKey = useMemo(
    () => `${draft._id}:${draftedDiscordUserIdsCsv}`,
    [draft._id, draftedDiscordUserIdsCsv]
  );

  const setupPhase = draft.status === "setup";
  const { team1: team1Bans, team2: team2Bans, auto: sourceTaggedAutoBans } = useMemo(
    () => splitBansForLiveSummary(draft.bans),
    [draft.bans]
  );
  const creatorAutoBans = setupPhase ? draft.bans : sourceTaggedAutoBans;
  const initialCaptainBans = useMemo(
    () =>
      draft.bans.filter(
        (ban) => ban.source === "captain" && (ban.phase ?? "initial") === "initial"
      ),
    [draft.bans]
  );
  const deferredCaptainBans = useMemo(
    () =>
      draft.bans.filter(
        (ban) => ban.source === "captain" && (ban.phase ?? "initial") === "deferred"
      ),
    [draft.bans]
  );
  const bannedClassNames = draft.bans.map((b) => b.className);
  const safeClassNames = draft.safeClassNames ?? [];

  const isSetup = setupPhase;
  const isCoinFlip = draft.status === "coin_flip";
  const isRealmPick = draft.status === "realm_pick";
  const isBanning = draft.status === "banning";
  const isDrafting = draft.status === "drafting";
  const isComplete = draft.status === "complete";
  const isCancelled = draft.status === "cancelled";

  const showBans = isBanning || isDrafting || isComplete;
  const team1FightWins = draft.team1FightWins ?? 0;
  const team2FightWins = draft.team2FightWins ?? 0;
  const displayedSetScore = draft.setScore ?? `${team1FightWins}-${team2FightWins}`;
  const isSetFinalized =
    draft.setFinalizedAt !== undefined || draft.setFinalizedBy !== undefined;
  const pendingSetWinnerTeam =
    draft.pendingWinnerTeam ??
    (!isSetFinalized
      ? team1FightWins >= 3
        ? 1
        : team2FightWins >= 3
          ? 2
          : undefined
      : undefined);
  const isSetComplete = isSetFinalized;
  const isCreatorView =
    isCreator || currentPlayer?.discordUserId === draft.createdBy;
  const actionToken = token ?? currentPlayer?.token;

  const coinFlipWinner = draft.players.find(
    (p) => p.discordUserId === draft.coinFlipWinnerId
  );
  const isCoinFlipWinner =
    currentPlayer?.discordUserId === draft.coinFlipWinnerId;

  let currentPickTeam: number | undefined;
  let currentPickCaptain: typeof team1Captain;
  let isMyPickTurn = false;
  if (isDrafting && draft.pickSequence && draft.currentPickIndex !== undefined) {
    currentPickTeam = draft.pickSequence[draft.currentPickIndex];
    const captainId =
      currentPickTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    currentPickCaptain = draft.players.find(
      (p) => p.discordUserId === captainId
    );
    isMyPickTurn = currentPlayer?.discordUserId === captainId;
  }

  let currentBanTeam: number | undefined;
  let isMyBanTurn = false;
  if (isBanning && draft.banSequence && draft.currentBanIndex !== undefined) {
    currentBanTeam = draft.banSequence[draft.currentBanIndex];
    const captainId =
      currentBanTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    isMyBanTurn = currentPlayer?.discordUserId === captainId;
  }

  let currentRealmPickTeam: number | undefined;
  let isMyRealmTurn = false;
  if (isRealmPick) {
    const t1Has = !!draft.team1Realm;
    const t2Has = !!draft.team2Realm;
    if (!t1Has && !t2Has) {
      currentRealmPickTeam = draft.firstRealmPickTeam!;
    } else {
      currentRealmPickTeam = draft.firstRealmPickTeam === 1 ? 2 : 1;
    }
    const captainId =
      currentRealmPickTeam === 1
        ? draft.team1CaptainId
        : draft.team2CaptainId;
    isMyRealmTurn = currentPlayer?.discordUserId === captainId;
  }

  const act = useCallback(
    async (fn: () => Promise<unknown>) => {
      if (busy) return;
      setBusy(true);
      setActionError(null);
      try {
        await fn();
      } catch (e) {
        console.error(e);
        const message =
          e && typeof e === "object" && "message" in e && typeof (e as any).message === "string"
            ? (e as any).message
            : "Action failed. Please try again.";
        setActionError(message);
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const applySettings = useCallback(
    async (
      type: "traditional" | "pvp",
      teamSize: number,
      pickOrderMode: PickOrderMode,
      bansPerCaptain: number,
      banTimingMode: BanTimingMode
    ) => {
      if (busy) return;
      setBusy(true);
      try {
        await (updateSettings as any)({
          draftId: draft._id,
          type,
          teamSize,
          pickOrderMode,
          bansPerCaptain,
          banTimingMode,
          token: token!,
        });
      } catch (e) {
        setSettingsFeedback({
          type: "error",
          text: toUserSettingsError(e),
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, draft._id, token, updateSettings]
  );

  const canStart =
    draft.team1CaptainId &&
    draft.team2CaptainId &&
    draft.players.length >= draft.teamSize * 2;

  useEffect(() => {
    if (!isSetup || !isCreator || !token || busy) return;
    if (isTeamSizeSelectable(draft.teamSize, draft.players.length)) return;
    const targetTeamSize = Math.max(2, getMaxSelectableTeamSize(draft.players.length));
    const adjustmentKey = `${draft._id}:${draft.teamSize}:${targetTeamSize}:${draft.players.length}`;
    if (autoAdjustedSettingsKey === adjustmentKey) return;
    setAutoAdjustedSettingsKey(adjustmentKey);
    void applySettings(
      draft.type,
      targetTeamSize,
      draft.pickOrderMode ?? "alternating",
      draft.bansPerCaptain ?? 2,
      draft.banTimingMode ?? "before_picks"
    );
  }, [
    applySettings,
    autoAdjustedSettingsKey,
    busy,
    draft._id,
    draft.players.length,
    draft.teamSize,
    draft.type,
    draft.pickOrderMode,
    draft.bansPerCaptain,
    draft.banTimingMode,
    isCreator,
    isSetup,
    token,
  ]);

  useEffect(() => {
    if (!draftedDiscordUserIdsCsv) {
      setLinkedProfiles((current) =>
        Object.keys(current).length === 0 ? current : {}
      );
      return;
    }
    const discordUserIds = draftedDiscordUserIdsCsv.split(",");
    fetch("/api/draft/linked-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordUserIds }),
    })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.links && typeof payload.links === "object") {
          setLinkedProfiles(payload.links as Record<string, LinkedProfileSummary>);
        }
      })
      .catch(() => {
        setLinkedProfiles((current) =>
          Object.keys(current).length === 0 ? current : {}
        );
      });
  }, [draftedProfilesFetchKey, draftedDiscordUserIdsCsv]);

  const canRecordFight =
    isComplete &&
    isCreatorView &&
    Boolean(draft.gameStarted) &&
    !isSetComplete &&
    pendingSetWinnerTeam === undefined;
  const isClassSnapshotReady = draftedPlayers.every(
    (player) => typeof player.selectedClass === "string" && player.selectedClass.length > 0
  );
  const editableTeam =
    currentPlayer?.discordUserId === draft.team1CaptainId
      ? 1
      : currentPlayer?.discordUserId === draft.team2CaptainId
        ? 2
        : null;
  const showPrimaryTeamGrid =
    !isCancelled && !(isComplete && draft.gameStarted && !isSetComplete);

  const canUndo =
    isCreator &&
    token &&
    ((isBanning && (draft.currentBanIndex ?? 0) > 0) ||
      (isBanning &&
        (draft.currentBanIndex ?? 0) === 0 &&
        ((draft.activeBanPhase ?? "initial") === "deferred"
          ? true
          : initialCaptainBans.length > 0)) ||
      (isDrafting && (draft.currentPickIndex ?? 0) > 0) ||
      (isDrafting && (draft.currentPickIndex ?? 0) === 0 && initialCaptainBans.length > 0) ||
      (isDrafting &&
        draft.deferredBanTriggered &&
        draft.currentPickIndex === draft.deferredBanTriggerPickCount &&
        deferredCaptainBans.length > 0) ||
      (isComplete && !draft.gameStarted));
  const cancelPhrase = "cancel this draft";
  const canCancelDraft =
    isCreatorView && !isCancelled && typeof actionToken === "string" && actionToken.length > 0;
  const isCancelPhraseValid =
    cancelConfirmationText.trim().toLowerCase() === cancelPhrase;

  let activeTeam1Label = "";
  let activeTeam2Label = "";
  if (isBanning && currentBanTeam !== undefined) {
    const banCaptainId =
      currentBanTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    const banCaptain = draft.players.find(
      (p) => p.discordUserId === banCaptainId
    );
    if (currentBanTeam === 1) {
      activeTeam1Label = isMyBanTurn ? "Your ban" : `${banCaptain?.displayName}'s ban`;
    } else {
      activeTeam2Label = isMyBanTurn ? "Your ban" : `${banCaptain?.displayName}'s ban`;
    }
  } else if (isDrafting && currentPickTeam !== undefined) {
    if (currentPickTeam === 1) {
      activeTeam1Label = isMyPickTurn ? "Your pick" : `${currentPickCaptain?.displayName}'s pick`;
    } else {
      activeTeam2Label = isMyPickTurn ? "Your pick" : `${currentPickCaptain?.displayName}'s pick`;
    }
  } else if (isRealmPick && currentRealmPickTeam !== undefined) {
    const realmCaptainId =
      currentRealmPickTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    const realmCaptain = draft.players.find(
      (p) => p.discordUserId === realmCaptainId
    );
    if (currentRealmPickTeam === 1) {
      activeTeam1Label = isMyRealmTurn ? "Your realm pick" : `${realmCaptain?.displayName}'s pick`;
    } else {
      activeTeam2Label = isMyRealmTurn ? "Your realm pick" : `${realmCaptain?.displayName}'s pick`;
    }
  }

  return (
    <div className="space-y-4">
      <StatusBar
        draft={draft}
        undoButton={
          canUndo ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-[11px] text-gray-600 hover:text-gray-400"
              onClick={() =>
                act(() =>
                  undoLastAction({
                    draftId: draft._id,
                    token: token!,
                  })
                )
              }
            >
              Undo
            </Button>
          ) : null
        }
        cancelButton={
          canCancelDraft ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-300"
              onClick={() => {
                setCancelConfirmationText("");
                setShowCancelConfirm(true);
              }}
            >
              Cancel Draft
            </Button>
          ) : null
        }
      />
      {actionError ? (
        <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">
          {actionError}
        </div>
      ) : null}
      {isCancelled ? (
        <div className="rounded-lg border border-indigo-500/40 bg-indigo-900/20 px-4 py-3">
          <p className="text-sm font-medium text-indigo-100">Draft cancelled</p>
          <p className="mt-1 text-xs text-indigo-200/80">
            This draft has been cancelled and players will be moved back to the lobby.
          </p>
        </div>
      ) : null}

      {isSetup && isCreator && (
        <SettingsBar
          draft={draft}
          busy={busy}
          hasCaptain1={!!draft.team1CaptainId}
          hasCaptain2={!!draft.team2CaptainId}
          onUpdateType={(type) => {
            setSettingsFeedback(null);
            if (type === "pvp") {
              if (draft.players.length < 4) {
                setSettingsFeedback({
                  type: "info",
                  text: "PvP requires at least 4 players. Add more players first.",
                });
                return;
              }
              const maxValidTeamSize = Math.max(
                2,
                getMaxSelectableTeamSize(draft.players.length)
              );
              const adjustedTeamSize = Math.min(draft.teamSize, maxValidTeamSize);
              if (adjustedTeamSize !== draft.teamSize) {
                setSettingsFeedback({
                  type: "info",
                  text: `Switched to PvP and adjusted team size to ${adjustedTeamSize}v${adjustedTeamSize} for ${draft.players.length} players.`,
                });
              }
              return applySettings(
                type,
                adjustedTeamSize,
                draft.pickOrderMode ?? "alternating",
                draft.bansPerCaptain ?? 2,
                draft.banTimingMode ?? "before_picks"
              );
            }
            return applySettings(
              type,
              draft.teamSize,
              draft.pickOrderMode ?? "alternating",
              draft.bansPerCaptain ?? 2,
              draft.banTimingMode ?? "before_picks"
            );
          }}
          onUpdateSize={(teamSize) => {
            setSettingsFeedback(null);
            return applySettings(
              draft.type,
              teamSize,
              draft.pickOrderMode ?? "alternating",
              draft.bansPerCaptain ?? 2,
              draft.banTimingMode ?? "before_picks"
            );
          }}
          onUpdatePickOrderMode={(pickOrderMode) => {
            setSettingsFeedback(null);
            return applySettings(
              draft.type,
              draft.teamSize,
              pickOrderMode,
              draft.bansPerCaptain ?? 2,
              draft.banTimingMode ?? "before_picks"
            );
          }}
          onUpdateBansPerCaptain={(bansPerCaptain) => {
            setSettingsFeedback(null);
            return applySettings(
              draft.type,
              draft.teamSize,
              draft.pickOrderMode ?? "alternating",
              bansPerCaptain,
              bansPerCaptain <= 1 ? "before_picks" : (draft.banTimingMode ?? "before_picks")
            );
          }}
          onUpdateBanTimingMode={(banTimingMode) => {
            setSettingsFeedback(null);
            return applySettings(
              draft.type,
              draft.teamSize,
              draft.pickOrderMode ?? "alternating",
              draft.bansPerCaptain ?? 2,
              banTimingMode
            );
          }}
          onStart={() =>
            act(() => startDraft({ draftId: draft._id, token: token! }))
          }
          canStart={!!canStart}
        />
      )}

      {isSetup && isCreator && settingsFeedback && (
        <div
          className={cn(
            "rounded-lg border px-4 py-2",
            settingsFeedback.type === "error"
              ? "border-rose-600/40 bg-rose-950/20"
              : "border-sky-600/40 bg-sky-950/20"
          )}
        >
          <p
            className={cn(
              "text-xs",
              settingsFeedback.type === "error"
                ? "text-rose-300"
                : "text-sky-300"
            )}
          >
            {settingsFeedback.text}
          </p>
        </div>
      )}

      {isSetup && isCreator && (
        <ClassRulesPanel
          draft={draft}
          bannedClassNames={bannedClassNames}
          safeClassNames={safeClassNames}
          creatorAutoBans={creatorAutoBans}
          busy={busy}
          onToggleAutoBan={(className) =>
            act(() =>
              toggleAutoBanClass({
                draftId: draft._id,
                className,
                token: token!,
              })
            )
          }
          onToggleSafeClass={(className) =>
            act(() =>
              toggleSafeClass({
                draftId: draft._id,
                className,
                token: token!,
              })
            )
          }
        />
      )}

      {isSetup && !isCreator && (
        <div className="flex items-center justify-center py-2">
          <span className="text-xs text-gray-600">
            Waiting for creator to configure and start...
          </span>
        </div>
      )}

      {isSetup && draft.players.length < draft.teamSize * 2 && (
        <div className="flex items-center justify-center rounded-lg border border-gray-700/80 bg-gray-800/60 px-4 py-3">
          <span className="text-xs text-gray-300">
            Need at least {draft.teamSize * 2} players for a {draft.teamSize}v{draft.teamSize} draft
            . Current players: {draft.players.length}. Reduce team size or add players to continue.
          </span>
        </div>
      )}

      {isCoinFlip && (
        <CoinFlipSection
          draft={draft}
          winner={coinFlipWinner}
          isCreator={isCreator}
          isWinner={isCoinFlipWinner}
          busy={busy}
          onFlip={() => act(() => startDraft({ draftId: draft._id, token: token! }))}
          onChoice={(choice) =>
            act(() =>
              setCoinFlipChoice({
                draftId: draft._id,
                choice,
                token: token!,
              })
            )
          }
        />
      )}

      {isRealmPick && (
        <RealmPickSection
          draft={draft}
          isMyTurn={isMyRealmTurn}
          currentTeam={currentRealmPickTeam}
          busy={busy}
          onPick={(realm) =>
            act(() =>
              pickRealm({
                draftId: draft._id,
                realm,
                token: token!,
              })
            )
          }
        />
      )}

      {showBans && (
        <BanSection
          draft={draft}
          bannedClassNames={bannedClassNames}
          team1Bans={team1Bans}
          team2Bans={team2Bans}
          autoBans={creatorAutoBans}
          safeClassNames={safeClassNames}
          isBanning={isBanning}
          isMyBanTurn={isMyBanTurn}
          currentBanTeam={currentBanTeam}
          busy={busy}
          onBan={(className) =>
            act(() =>
              banClass({
                draftId: draft._id,
                className,
                token: token!,
              })
            )
          }
        />
      )}

      {showPrimaryTeamGrid && (
      <div className="grid grid-cols-2 lg:grid-cols-[1fr_minmax(200px,280px)_1fr] gap-3">
        <div className="order-1">
          <TeamPanel
            team={1}
            captain={team1Captain}
            players={team1Players}
            realm={draft.team1Realm}
            teamSize={draft.teamSize}
            isActive={
              (isDrafting && currentPickTeam === 1) ||
              (isBanning && currentBanTeam === 1) ||
              (isRealmPick && currentRealmPickTeam === 1)
            }
            turnLabel={activeTeam1Label}
            isWinner={draft.winnerTeam === 1}
            showWinner={isComplete}
          />
        </div>

        <div className="order-3 lg:order-2 col-span-2 lg:col-span-1 mx-auto w-full max-w-xs lg:max-w-none">
          {isComplete && draft.gameStarted && isSetComplete ? (
            <MatchCenterScore score={displayedSetScore} />
          ) : (
            <PlayerPool
              players={
                isSetup
                  ? draft.players.filter(
                      (p) =>
                        p.discordUserId !== draft.team1CaptainId &&
                        p.discordUserId !== draft.team2CaptainId
                    )
                  : availablePlayers
              }
              isSetup={isSetup}
              isDrafting={isDrafting}
              isCreator={isCreator}
              isMyPickTurn={isMyPickTurn}
              currentPickCaptainName={currentPickCaptain?.displayName}
              needsCaptain1={isSetup && !draft.team1CaptainId}
              needsCaptain2={
                isSetup && !!draft.team1CaptainId && !draft.team2CaptainId
              }
              busy={busy}
              onAssignCaptain={(discordUserId, team) =>
                act(() =>
                  assignCaptain({
                    draftId: draft._id,
                    discordUserId,
                    team,
                    token: token!,
                  })
                )
              }
              onPickPlayer={(playerId) =>
                act(() =>
                  pickPlayer({
                    draftId: draft._id,
                    playerId,
                    token: token!,
                  })
                )
              }
            />
          )}
        </div>

        <div className="order-2 lg:order-3">
          <TeamPanel
            team={2}
            captain={team2Captain}
            players={team2Players}
            realm={draft.team2Realm}
            teamSize={draft.teamSize}
            isActive={
              (isDrafting && currentPickTeam === 2) ||
              (isBanning && currentBanTeam === 2) ||
              (isRealmPick && currentRealmPickTeam === 2)
            }
            turnLabel={activeTeam2Label}
            isWinner={draft.winnerTeam === 2}
            showWinner={isComplete}
          />
        </div>
      </div>
      )}

      {isComplete && draft.gameStarted && !isSetComplete && (
        <div>
          <FightClassSetup
            pendingSetWinnerTeam={pendingSetWinnerTeam}
            displayedSetScore={displayedSetScore}
            isCreatorView={isCreatorView}
            onFinalizeSet={() => setShowFinalizeConfirm(true)}
            fightNumber={(draft.fights?.length ?? 0) + 1}
            team1={{
              label: team1Captain?.displayName ?? "Team 1",
              players: [team1Captain, ...team1Players].filter(
                Boolean
              ) as DraftData["players"],
            }}
            team2={{
              label: team2Captain?.displayName ?? "Team 2",
              players: [team2Captain, ...team2Players].filter(
                Boolean
              ) as DraftData["players"],
            }}
            fights={draft.fights}
            allPlayers={draft.players}
            linkedProfiles={linkedProfiles}
            classOptions={allClasses}
            bannedClassNames={bannedClassNames}
            canEditClasses={editableTeam !== null}
            editableTeam={editableTeam}
            canRecordWinner={isCreatorView}
            busy={busy}
            onSetPlayerClass={(playerId, className) =>
              act(() =>
                (setPlayerClass as any)({
                  draftId: draft._id,
                  playerId,
                  className,
                  token: token!,
                })
              )
            }
            onSetFightPlayerClass={(fightNumber, playerId, className) =>
              act(() =>
                (setPlayerClass as any)({
                  draftId: draft._id,
                  fightNumber,
                  playerId,
                  className,
                  token: token!,
                })
              )
            }
            canRecordFight={canRecordFight}
            isClassSnapshotReady={isClassSnapshotReady}
            onRecordWinner={(winnerTeam) =>
              act(() =>
                recordFightResult({
                  draftId: draft._id,
                  classesByPlayer: draftedPlayers.map((player) => ({
                    playerId: player._id,
                    className: player.selectedClass!,
                  })),
                  winnerTeam,
                  token: token!,
                })
              )
            }
          onUpdateFightWinner={(fightNumber, winnerTeam) =>
            act(() =>
              updateFightWinner({
                draftId: draft._id,
                fightNumber,
                winnerTeam,
                token: token!,
              })
            )
          }
          />
        </div>
      )}

      {isComplete && isCreatorView && !draft.gameStarted && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              act(() =>
                beginGame({
                  draftId: draft._id,
                  token: token!,
                })
              )
            }
          >
            Draft Complete
          </Button>
        </div>
      )}

      {isComplete && !isCreatorView && !draft.gameStarted && (
        <div className="flex justify-center pt-2">
          <span className="text-xs text-gray-600">
            Waiting for creator...
          </span>
        </div>
      )}

      {isComplete && (
        <div className="pt-4">
          <DiscordIdentityLinkCard
            draftDiscordUserId={currentPlayer?.discordUserId}
          />
        </div>
      )}

      {showFinalizeConfirm && pendingSetWinnerTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFinalizeConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
            <div className="px-5 pt-5 pb-4">
              <p className="text-sm font-medium text-white">Finalize set result</p>
              <p className="mt-1 text-sm text-gray-400">Team {pendingSetWinnerTeam} wins</p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button
                type="button"
                onClick={() => setShowFinalizeConfirm(false)}
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!actionToken) {
                    setActionError("Missing player token for finalizing set.");
                    return;
                  }
                  act(async () => {
                    await finalizeSetResult({
                      draftId: draft._id,
                      token: actionToken,
                    });
                    setShowFinalizeConfirm(false);
                  });
                }}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
            <div className="px-5 pt-5 pb-4">
              <p className="text-sm font-medium text-white">Cancel draft</p>
              <p className="mt-1 text-xs text-gray-400">
                This ends the draft immediately and returns players to the lobby flow.
              </p>
              <p className="mt-3 text-[11px] text-gray-500">
                Type <span className="font-medium text-gray-300">cancel this draft</span> to
                confirm.
              </p>
              <input
                value={cancelConfirmationText}
                onChange={(event) => setCancelConfirmationText(event.target.value)}
                placeholder="cancel this draft"
                className="mt-2 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-gray-500"
              />
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy || !isCancelPhraseValid}
                onClick={() => {
                  if (!actionToken) {
                    setActionError("Missing player token for cancelling draft.");
                    return;
                  }
                  act(async () => {
                    await cancelDraftByCreator({
                      draftId: draft._id,
                      token: actionToken,
                      confirmationText: cancelConfirmationText,
                    });
                    setShowCancelConfirm(false);
                    setCancelConfirmationText("");
                  });
                }}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  busy || !isCancelPhraseValid
                    ? "border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed"
                    : "border-rose-700/70 bg-rose-900/40 text-rose-100 hover:bg-rose-800/50"
                )}
              >
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBar({
  draft,
  undoButton,
  cancelButton,
}: {
  draft: DraftData;
  undoButton?: React.ReactNode;
  cancelButton?: React.ReactNode;
}) {
  let subtitle = "";
  if (draft.status === "setup") {
    subtitle = `${draft.players.length} players in lobby`;
  } else if (draft.status === "coin_flip") {
    subtitle = draft.coinFlipWinnerId ? "Flipping..." : "Waiting to flip";
  } else if (draft.status === "realm_pick") {
    subtitle = "Choose your realm";
  } else if (draft.status === "banning") {
    subtitle = `Ban ${(draft.currentBanIndex ?? 0) + 1} of ${(draft.banSequence ?? []).length}`;
  } else if (draft.status === "drafting") {
    subtitle = `Pick ${(draft.currentPickIndex ?? 0) + 1} of ${(draft.pickSequence ?? []).length}`;
  } else if (draft.status === "complete") {
    const isSetFinalized =
      draft.setFinalizedAt !== undefined || draft.setFinalizedBy !== undefined;
    const inferredPendingWinnerTeam =
      draft.pendingWinnerTeam ??
      (!isSetFinalized
        ? (draft.team1FightWins ?? 0) >= 3
          ? 1
          : (draft.team2FightWins ?? 0) >= 3
            ? 2
            : undefined
        : undefined);
    if (draft.gameStarted) {
      if (isSetFinalized && draft.winnerTeam) {
        const score = draft.setScore ?? `${draft.team1FightWins ?? 0}-${draft.team2FightWins ?? 0}`;
        subtitle = `Team ${draft.winnerTeam} wins (${score})`;
      } else if (inferredPendingWinnerTeam) {
        subtitle = "Set point reached - awaiting creator finalization";
      } else {
        subtitle = "Record fight results";
      }
    } else if (isSetFinalized && draft.winnerTeam) {
      const score = draft.setScore ?? `${draft.team1FightWins ?? 0}-${draft.team2FightWins ?? 0}`;
      subtitle = `Team ${draft.winnerTeam} wins (${score})`;
    } else {
      subtitle = "Draft complete";
    }
  } else if (draft.status === "cancelled") {
    subtitle = "Draft cancelled";
  }

  const isSetup = draft.status === "setup";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Draft</h1>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {undoButton}
          {!isSetup && (
            <>
              <Badge variant="outline" className="capitalize text-[10px]">
                {draft.type === "pvp" ? "PvP" : draft.type}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {draft.teamSize}v{draft.teamSize}
              </Badge>
            </>
          )}
        </div>
      </div>
      {cancelButton ? <div className="flex justify-end">{cancelButton}</div> : null}
    </div>
  );
}

function SettingsBar({
  draft,
  busy,
  hasCaptain1,
  hasCaptain2,
  onUpdateType,
  onUpdateSize,
  onUpdatePickOrderMode,
  onUpdateBansPerCaptain,
  onUpdateBanTimingMode,
  onStart,
  canStart,
}: {
  draft: DraftData;
  busy: boolean;
  hasCaptain1: boolean;
  hasCaptain2: boolean;
  onUpdateType: (type: "traditional" | "pvp") => void;
  onUpdateSize: (size: number) => void;
  onUpdatePickOrderMode: (mode: PickOrderMode) => void;
  onUpdateBansPerCaptain: (value: number) => void;
  onUpdateBanTimingMode: (mode: BanTimingMode) => void;
  onStart: () => void;
  canStart: boolean;
}) {
  const needsCaptains = !hasCaptain1 || !hasCaptain2;
  const bansPerCaptain = draft.bansPerCaptain ?? 2;
  const banTimingMode = draft.banTimingMode ?? "before_picks";
  const timingPickCount =
    banTimingMode === "after_2_picks"
      ? 2
      : banTimingMode === "after_3_picks"
        ? 3
        : banTimingMode === "after_4_picks"
          ? 4
          : undefined;
  const formatBanCount = (count: number) =>
    `${count} ${count === 1 ? "ban" : "bans"}`;
  const getBanScheduleLabel = (pickCount?: number) => {
    if (!pickCount) return `All ${formatBanCount(bansPerCaptain)} before picks`;
    if (bansPerCaptain <= 1) return `1 ban before picks`;
    return `1 before picks, ${bansPerCaptain - 1} after ${pickCount} picks`;
  };
  const banTimingLabel = getBanScheduleLabel(timingPickCount);
  const prePickBansPerCaptain =
    banTimingMode === "before_picks" ? bansPerCaptain : Math.min(1, bansPerCaptain);
  const postPickBansPerCaptain =
    banTimingMode === "before_picks" ? 0 : Math.max(0, bansPerCaptain - 1);
  const banTimingSummary =
    bansPerCaptain === 0
      ? "No captain bans in this draft."
      : banTimingMode === "before_picks"
        ? `Each captain bans ${bansPerCaptain} before player picks start.`
        : postPickBansPerCaptain === 0
          ? `Each captain bans ${prePickBansPerCaptain} before picks. There is no second ban round with this ban count.`
          : `Each captain bans ${prePickBansPerCaptain} before picks, then ${postPickBansPerCaptain} more after ${timingPickCount} total player picks.`;
  const laterBanDisabled = bansPerCaptain <= 1;
  const laterBanHelpText = laterBanDisabled
    ? "Choose 2+ bans per captain to add a later ban round."
    : `${formatBanCount(1)} before picks, ${formatBanCount(bansPerCaptain - 1)} later.`;
  let buttonLabel = "Start Draft";
  if (!hasCaptain1) {
    buttonLabel = "Assign Captains";
  } else if (!hasCaptain2) {
    buttonLabel = "Assign Captain 2";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-3">
      <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 xl:flex xl:w-auto xl:items-center xl:gap-3">
        <Select
          value={draft.type}
          onValueChange={(v) => onUpdateType(v as "traditional" | "pvp")}
          disabled={busy}
        >
          <SelectTrigger className="h-8 w-full text-xs border-gray-700 bg-gray-800/60 sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="traditional">Traditional</SelectItem>
            <SelectItem value="pvp">PvP</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(draft.teamSize)}
          onValueChange={(v) => onUpdateSize(Number(v))}
          disabled={busy}
        >
          <SelectTrigger className="h-8 w-full text-xs border-gray-700 bg-gray-800/60 sm:w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6, 7, 8].map((s) => (
              <SelectItem
                key={s}
                value={String(s)}
                disabled={!isTeamSizeSelectable(s, draft.players.length)}
              >
                {s}v{s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-1">
          <Select
            value={draft.pickOrderMode ?? "alternating"}
            onValueChange={(v) => onUpdatePickOrderMode(v as PickOrderMode)}
            disabled={busy}
          >
            <SelectTrigger className="h-8 w-full text-xs border-gray-700 bg-gray-800/60 sm:w-[170px]">
              <span className="truncate">
                {(draft.pickOrderMode ?? "alternating") === "alternating"
                  ? "Alternating"
                  : "Snake"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="snake">
                <div className="flex flex-col">
                  <span>Snake</span>
                  <span className="text-[10px] text-gray-500">
                    After the first pick, the other captain picks twice in a row.
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="alternating">
                <div className="flex flex-col">
                  <span>Alternating</span>
                  <span className="text-[10px] text-gray-500">
                    Captains alternate one pick at a time.
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select
          value={String(bansPerCaptain)}
          onValueChange={(v) => onUpdateBansPerCaptain(Number(v))}
          disabled={busy}
        >
          <SelectTrigger className="h-8 w-full min-w-0 text-xs border-gray-700 bg-gray-800/60 whitespace-nowrap sm:min-w-[180px] xl:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count} {count === 1 ? "ban" : "bans"} per captain
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={banTimingMode}
          onValueChange={(v) => onUpdateBanTimingMode(v as BanTimingMode)}
          disabled={busy}
        >
          <SelectTrigger className="h-8 w-full min-w-0 text-xs border-gray-700 bg-gray-800/60 whitespace-nowrap sm:min-w-[250px] xl:w-[250px]">
            <span className="truncate">{banTimingLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before_picks">
              <div className="flex flex-col">
                <span>{getBanScheduleLabel()}</span>
                <span className="text-[10px] text-gray-500">
                  Finish the full ban round before any player picks.
                </span>
              </div>
            </SelectItem>
            <SelectItem value="after_2_picks" disabled={laterBanDisabled}>
              <div className="flex flex-col">
                <span>{getBanScheduleLabel(2)}</span>
                <span className="text-[10px] text-gray-500">
                  {laterBanDisabled ? laterBanHelpText : `${laterBanHelpText} Pause after 2 picks.`}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="after_3_picks" disabled={laterBanDisabled}>
              <div className="flex flex-col">
                <span>{getBanScheduleLabel(3)}</span>
                <span className="text-[10px] text-gray-500">
                  {laterBanDisabled ? laterBanHelpText : `${laterBanHelpText} Pause after 3 picks.`}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="after_4_picks" disabled={laterBanDisabled}>
              <div className="flex flex-col">
                <span>{getBanScheduleLabel(4)}</span>
                <span className="text-[10px] text-gray-500">
                  {laterBanDisabled ? laterBanHelpText : `${laterBanHelpText} Pause after 4 picks.`}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="w-full text-left text-[11px] text-gray-400">{banTimingSummary}</p>
      <Button
        variant={needsCaptains ? "secondary" : "outline"}
        size="sm"
        disabled={needsCaptains ? true : !canStart || busy}
        onClick={needsCaptains ? undefined : onStart}
        className={cn(
          "h-8 text-xs",
          needsCaptains &&
            "opacity-100 cursor-not-allowed border border-indigo-500/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/15"
        )}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

function CoinFlipSection({
  draft,
  winner,
  isCreator,
  isWinner,
  busy,
  onFlip,
  onChoice,
}: {
  draft: DraftData;
  winner?: { displayName: string; avatarUrl?: string };
  isCreator: boolean;
  isWinner: boolean;
  busy: boolean;
  onFlip: () => void;
  onChoice: (choice: string) => void;
}) {
  const [phase, setPhase] = useState<"waiting" | "spinning" | "landed" | "done">(
    draft.coinFlipWinnerId ? "spinning" : "waiting"
  );

  useEffect(() => {
    if (!draft.coinFlipWinnerId) {
      setPhase("waiting");
      return;
    }
    setPhase("spinning");
    const t1 = setTimeout(() => setPhase("landed"), 1200);
    const t2 = setTimeout(() => setPhase("done"), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [draft.coinFlipWinnerId]);

  const winnerTeam = draft.coinFlipWinnerId
    ? draft.coinFlipWinnerId === draft.team1CaptainId
      ? 1
      : 2
    : undefined;

  const team1Captain = draft.players.find(
    (p) => p.discordUserId === draft.team1CaptainId
  );
  const team2Captain = draft.players.find(
    (p) => p.discordUserId === draft.team2CaptainId
  );

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-6 py-8">
      <div className="flex flex-col items-center gap-6">
        <p className="text-xs uppercase tracking-widest text-gray-600">
          Coin Flip
        </p>

        <div className="flex items-center gap-8">
          <div className="text-center w-24">
            <div className="flex flex-col items-center gap-1">
              <PlayerAvatar
                url={team1Captain?.avatarUrl}
                name={team1Captain?.displayName}
                size={26}
              />
              <p
                className={cn(
                  "text-sm font-medium transition-colors duration-500",
                  phase !== "spinning" && winnerTeam === 1
                    ? "text-white"
                    : "text-gray-600"
                )}
              >
                {team1Captain?.displayName}
              </p>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5">Team 1</p>
          </div>

          <div
            className="relative w-16 h-16"
            style={{ perspective: "600px" }}
          >
            <motion.div
              className="w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
              animate={
                phase === "spinning"
                  ? { rotateX: [0, 1800] }
                  : { rotateX: winnerTeam === 2 ? 180 : 0 }
              }
              transition={
                phase === "spinning"
                  ? { duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }
                  : { duration: 0.3, ease: "easeOut" }
              }
            >
              <div
                className="absolute inset-0 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-lg font-bold text-gray-300">1</span>
              </div>
              <div
                className="absolute inset-0 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateX(180deg)",
                }}
              >
                <span className="text-lg font-bold text-gray-300">2</span>
              </div>
            </motion.div>
          </div>

          <div className="text-center w-24">
            <div className="flex flex-col items-center gap-1">
              <PlayerAvatar
                url={team2Captain?.avatarUrl}
                name={team2Captain?.displayName}
                size={26}
              />
              <p
                className={cn(
                  "text-sm font-medium transition-colors duration-500",
                  phase !== "spinning" && winnerTeam === 2
                    ? "text-white"
                    : "text-gray-600"
                )}
              >
                {team2Captain?.displayName}
              </p>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5">Team 2</p>
          </div>
        </div>

        <AnimatePresence>
          {phase === "waiting" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-xs text-gray-600">
                Waiting for creator to flip the coin...
              </p>
              {isCreator && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={onFlip}
                >
                  Flip Coin
                </Button>
              )}
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-white leading-none">
                  <PlayerAvatar
                    url={winner?.avatarUrl}
                    name={winner?.displayName}
                    size={20}
                  />
                  {winner?.displayName ?? "Winner"}
                </span>
                <span className="text-gray-400 leading-none">wins the flip</span>
              </div>

              {isWinner && !busy && (
                <div className="flex gap-2">
                  {draft.type === "traditional" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChoice("realm_first")}
                      >
                        Pick Realm First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChoice("player_first")}
                      >
                        Pick Player First
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChoice("pick_first")}
                      >
                        Pick First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChoice("pick_second")}
                      >
                        Pick Second
                      </Button>
                    </>
                  )}
                </div>
              )}

              {!isWinner && (
                <p className="text-xs text-gray-600">
                  Waiting for {winner?.displayName} to choose...
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RealmPickSection({
  draft,
  isMyTurn,
  currentTeam,
  busy,
  onPick,
}: {
  draft: DraftData;
  isMyTurn: boolean;
  currentTeam?: number;
  busy: boolean;
  onPick: (realm: string) => void;
}) {
  const takenRealm = draft.team1Realm || draft.team2Realm;
  const currentCaptainId =
    currentTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;
  const currentCaptain = draft.players.find(
    (p) => p.discordUserId === currentCaptainId
  );

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-4">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span className="text-xs text-gray-500">
          {isMyTurn
            ? "Choose your realm"
            : `${currentCaptain?.displayName}'s realm pick`}
        </span>
        <div className="flex gap-2">
          {REALMS.map((realm) => {
            const taken = takenRealm === realm;
            return (
              <button
                key={realm}
                disabled={!isMyTurn || busy || taken}
                onClick={() => onPick(realm)}
                className={cn(
                  "rounded-md border px-4 py-1.5 text-xs font-medium transition-all",
                  taken && "border-gray-700 text-gray-600 line-through opacity-40 cursor-not-allowed",
                  !taken && isMyTurn && "border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer",
                  !taken && !isMyTurn && "border-gray-700 text-gray-600"
                )}
              >
                {realm}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {draft.team1Realm && (
            <Badge variant="secondary" className="text-[10px]">
              T1: {draft.team1Realm}
            </Badge>
          )}
          {draft.team2Realm && (
            <Badge variant="default" className="text-[10px]">
              T2: {draft.team2Realm}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

type ClassRulesMode = "ban" | "safe";

function ClassRulesPanel({
  draft,
  bannedClassNames,
  safeClassNames,
  creatorAutoBans,
  busy,
  onToggleAutoBan,
  onToggleSafeClass,
}: {
  draft: DraftData;
  bannedClassNames: string[];
  safeClassNames: string[];
  creatorAutoBans: { _id: string; className: string }[];
  busy: boolean;
  onToggleAutoBan: (className: string) => void;
  onToggleSafeClass: (className: string) => void;
}) {
  const [mode, setMode] = useState<ClassRulesMode>("ban");
  const [open, setOpen] = useState(false);
  const bannedSet = new Set(bannedClassNames);
  const safeClassSet = new Set(safeClassNames);
  const canEdit = !busy;

  const hasBans = creatorAutoBans.length > 0;
  const hasSafe = safeClassNames.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setOpen((c) => !c)}
          className={cn(
            "gap-1.5",
            open && "border-gray-500 bg-gray-800"
          )}
        >
          {open ? "Hide class rules" : "Class rules"}
        </Button>

        {(hasBans || hasSafe) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-gray-900/40 px-2.5 py-1.5">
            {hasBans && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                  <Ban size={9} />
                  Banned
                </span>
                {creatorAutoBans.map((ban) => (
                  <span
                    key={ban._id}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      getRealmChipBackground(ban.className),
                      safeClassSet.has(ban.className)
                        ? "text-gray-300"
                        : "text-gray-500 line-through"
                    )}
                  >
                    {ban.className}
                  </span>
                ))}
              </div>
            )}
            {hasSafe && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                  <ShieldCheck size={9} />
                  Safe
                </span>
                {safeClassNames.map((className) => (
                  <span
                    key={className}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-300",
                      getRealmChipBackground(className)
                    )}
                  >
                    {className}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-md bg-gray-900/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode("ban")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all",
                  mode === "ban"
                    ? "bg-gray-700 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Ban size={12} />
                Auto-ban
                {hasBans && (
                  <span className="ml-0.5 rounded-full bg-gray-600/40 px-1.5 py-0.5 text-[9px] text-gray-300">
                    {creatorAutoBans.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode("safe")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all",
                  mode === "safe"
                    ? "bg-gray-700 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                <ShieldCheck size={12} />
                Safe
                {hasSafe && (
                  <span className="ml-0.5 rounded-full bg-gray-600/40 px-1.5 py-0.5 text-[9px] text-gray-300">
                    {safeClassNames.length}
                  </span>
                )}
              </button>
            </div>
            <span className="text-[10px] text-gray-500">
              {mode === "ban"
                ? "Select classes to auto-ban before the draft starts"
                : "Select classes that captains cannot ban"}
            </span>
          </div>

          <ClassRulesGrid
            draft={draft}
            bannedSet={bannedSet}
            safeClassSet={safeClassSet}
            mode={mode}
            canEdit={canEdit}
            onToggle={mode === "ban" ? onToggleAutoBan : onToggleSafeClass}
          />
        </div>
      )}
    </div>
  );
}

function ClassRulesGrid({
  draft,
  bannedSet,
  safeClassSet,
  mode,
  canEdit,
  onToggle,
}: {
  draft: DraftData;
  bannedSet: Set<string>;
  safeClassSet: Set<string>;
  mode: ClassRulesMode;
  canEdit: boolean;
  onToggle: (className: string) => void;
}) {
  const isPvp = draft.type === "pvp";

  return (
    <div className="space-y-2">
      {(Object.entries(CLASS_CATEGORIES) as [ClassCategory, string[]][]).map(
        ([category, classes]) => {
          if (isPvp) {
            const hasAny = REALMS.some((realm) =>
              classes.some((c) => (classesByRealm[realm] || []).includes(c))
            );
            if (!hasAny) return null;
          } else {
            const relevantClasses = classes.filter((c) => allClasses.includes(c));
            if (relevantClasses.length === 0) return null;
          }

          return (
            <div key={category} className="flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-wider font-medium w-14 shrink-0 pt-1.5 text-gray-500">
                {category}
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {REALMS.map((realm) => {
                  const realmClasses = classes
                    .filter((c) => (classesByRealm[realm] || []).includes(c))
                    .sort((a, b) => a.localeCompare(b));
                  if (realmClasses.length === 0) return null;
                  return (
                    <div
                      key={`${category}-${realm}`}
                      className={cn(
                        "flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
                        realm === "Albion"
                          ? "bg-red-900/15"
                          : realm === "Midgard"
                            ? "bg-blue-900/15"
                            : "bg-green-900/15"
                      )}
                    >
                      {realmClasses.map((className) => {
                        const realmTag =
                          realm === "Albion"
                            ? "Alb"
                            : realm === "Midgard"
                              ? "Mid"
                              : "Hib";
                        const classKey =
                          isPvp && className === "Mauler"
                            ? `Mauler (${realmTag})`
                            : className;
                        const isBanned = bannedSet.has(classKey);
                        const isSafe = safeClassSet.has(classKey);

                        const isActive = mode === "ban" ? isBanned : isSafe;
                        const isLocked = mode === "ban" ? isSafe : isBanned;

                        let btnClass: string;
                        if (isActive) {
                          btnClass =
                            mode === "ban"
                              ? "text-gray-600 line-through"
                              : "bg-gray-700/70 text-white";
                        } else if (isLocked) {
                          btnClass =
                            mode === "ban"
                              ? "text-gray-600 cursor-not-allowed"
                              : "text-gray-600 line-through cursor-not-allowed";
                        } else {
                          btnClass =
                            "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer";
                        }

                        return (
                          <button
                            key={classKey}
                            type="button"
                            disabled={!canEdit || isLocked}
                            onClick={() => onToggle(classKey)}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                              btnClass,
                              !canEdit && "opacity-50 cursor-not-allowed"
                            )}
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
  );
}

function BanSection({
  draft,
  bannedClassNames,
  team1Bans,
  team2Bans,
  isBanning,
  isMyBanTurn,
  currentBanTeam,
  busy,
  onBan,
  title = "Bans",
  turnLabel,
  showBoardWhenNotBanning = false,
  autoBans = [],
  safeClassNames = [],
}: {
  draft: DraftData;
  bannedClassNames: string[];
  team1Bans: { _id: string; className: string }[];
  team2Bans: { _id: string; className: string }[];
  isBanning: boolean;
  isMyBanTurn: boolean;
  currentBanTeam?: number;
  busy: boolean;
  onBan: (className: string) => void;
  title?: string;
  turnLabel?: string;
  showBoardWhenNotBanning?: boolean;
  autoBans?: { _id: string; className: string }[];
  safeClassNames?: string[];
}) {
  const safeClassSet = new Set(safeClassNames);
  let classesForBan: string[];
  if (draft.type === "traditional" && isBanning && currentBanTeam) {
    const opponentRealm =
      currentBanTeam === 1 ? draft.team2Realm! : draft.team1Realm!;
    classesForBan = classesByRealm[opponentRealm] || [];
  } else if (draft.type === "traditional" && showBoardWhenNotBanning) {
    classesForBan = allClasses;
  } else if (draft.type === "pvp") {
    classesForBan = allClasses;
  } else {
    const allBannedRealms = new Set<string>();
    if (draft.team1Realm) {
      (classesByRealm[draft.team1Realm] || []).forEach((c) =>
        allBannedRealms.add(c)
      );
    }
    if (draft.team2Realm) {
      (classesByRealm[draft.team2Realm] || []).forEach((c) =>
        allBannedRealms.add(c)
      );
    }
    classesForBan = Array.from(allBannedRealms).sort();
  }

  const banCurrentCaptainId =
    currentBanTeam === 1 ? draft.team1CaptainId : draft.team2CaptainId;
  const banCurrentCaptain = draft.players.find(
    (p) => p.discordUserId === banCurrentCaptainId
  );
  const traditionalBanRealms =
    draft.type !== "pvp" && isBanning && currentBanTeam
      ? [currentBanTeam === 1 ? draft.team2Realm! : draft.team1Realm!]
      : REALMS.filter((realm) =>
          classesForBan.some((className) =>
            (classesByRealm[realm] || []).includes(className)
          )
        );

  const hasAnySummary =
    team1Bans.length > 0 ||
    team2Bans.length > 0 ||
    autoBans.length > 0 ||
    safeClassNames.length > 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">{title}</span>
          {isBanning && (
            <span className="text-[10px] text-gray-600">
              {isMyBanTurn
                ? "Your ban"
                : `${banCurrentCaptain?.displayName}'s ban`}
            </span>
          )}
          {!isBanning && turnLabel ? (
            <span className="text-[10px] text-gray-600">{turnLabel}</span>
          ) : null}
        </div>
      </div>

      {hasAnySummary && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md bg-gray-900/40 px-3 py-2">
          {team1Bans.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <Ban size={9} />
                T1
              </span>
              {team1Bans.map((b) => (
                <span
                  key={b._id}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    getRealmChipBackground(b.className),
                    safeClassSet.has(b.className)
                      ? "text-gray-300"
                      : "text-gray-500 line-through"
                  )}
                >
                  {b.className}
                </span>
              ))}
            </div>
          )}
          {team2Bans.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <Ban size={9} />
                T2
              </span>
              {team2Bans.map((b) => (
                <span
                  key={b._id}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    getRealmChipBackground(b.className),
                    safeClassSet.has(b.className)
                      ? "text-gray-300"
                      : "text-gray-500 line-through"
                  )}
                >
                  {b.className}
                </span>
              ))}
            </div>
          )}
          {autoBans.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <Ban size={9} />
                Auto
              </span>
              {autoBans.map((b) => (
                <span
                  key={b._id}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    getRealmChipBackground(b.className),
                    safeClassSet.has(b.className)
                      ? "text-gray-300"
                      : "text-gray-500 line-through"
                  )}
                >
                  {b.className}
                </span>
              ))}
            </div>
          )}
          {safeClassNames.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <ShieldCheck size={9} />
                Safe
              </span>
              {safeClassNames.map((className) => (
                <span
                  key={className}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-300",
                    getRealmChipBackground(className)
                  )}
                >
                  {className}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {(isBanning || showBoardWhenNotBanning) && draft.type === "pvp" && (
        <div className="space-y-2">
          {(
            Object.entries(CLASS_CATEGORIES) as [ClassCategory, string[]][]
          ).map(([category, classes]) => {
            const hasAny = REALMS.some((r) =>
              classes.some((c) => (classesByRealm[r] || []).includes(c))
            );
            if (!hasAny) return null;
            return (
              <div key={category} className="flex items-start gap-3">
                <span className="text-[10px] uppercase tracking-wider font-medium w-14 shrink-0 pt-1 text-gray-500">
                  {category}
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {REALMS.map((realm) => {
                    const realmClasses = classes
                      .filter((c) => (classesByRealm[realm] || []).includes(c))
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
                        key={realm}
                        className={cn(
                          "flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
                          groupBg
                        )}
                      >
                        {realmClasses.map((cls) => {
                          const realmTag =
                            realm === "Albion"
                              ? "Alb"
                              : realm === "Midgard"
                                ? "Mid"
                                : "Hib";
                          const banKey =
                            cls === "Mauler"
                              ? `Mauler (${realmTag})`
                              : cls;
                          const isBanned =
                            bannedClassNames.includes(banKey);
                          const isSafe = safeClassSet.has(banKey);
                          return (
                            <button
                              key={banKey}
                              disabled={!isMyBanTurn || busy || isBanned || isSafe}
                              onClick={() => onBan(banKey)}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                                isBanned && "text-gray-600 line-through",
                                isSafe && "text-gray-600 cursor-not-allowed",
                                !isBanned &&
                                  !isSafe &&
                                  isMyBanTurn &&
                                  "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer",
                                !isBanned &&
                                  !isSafe &&
                                  !isMyBanTurn &&
                                  "text-gray-600"
                              )}
                            >
                              {cls}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isBanning || showBoardWhenNotBanning) && draft.type !== "pvp" && (
        <div className="space-y-2">
          {(Object.entries(CLASS_CATEGORIES) as [ClassCategory, string[]][]).map(
            ([category, classes]) => {
              const hasAny = traditionalBanRealms.some((r) =>
                classes.some(
                  (c) =>
                    (classesByRealm[r] || []).includes(c) &&
                    classesForBan.includes(c)
                )
              );
              if (!hasAny) return null;
              return (
                <div key={category} className="flex items-start gap-3">
                  <span className="text-[10px] uppercase tracking-wider font-medium w-14 shrink-0 pt-1 text-gray-500">
                    {category}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {traditionalBanRealms.map((realm) => {
                      const realmClasses = classes
                        .filter(
                          (c) =>
                            (classesByRealm[realm] || []).includes(c) &&
                            classesForBan.includes(c)
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
                          key={realm}
                          className={cn(
                            "flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
                            groupBg
                          )}
                        >
                          {realmClasses.map((cls) => {
                            const isBanned = bannedClassNames.includes(cls);
                            const isSafe = safeClassSet.has(cls);
                            return (
                              <button
                                key={cls}
                                disabled={!isMyBanTurn || busy || isBanned || isSafe}
                                onClick={() => onBan(cls)}
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                                  isBanned && "text-gray-600 line-through",
                                  isSafe && "text-gray-600 cursor-not-allowed",
                                  !isBanned &&
                                    !isSafe &&
                                    isMyBanTurn &&
                                    "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer",
                                  !isBanned &&
                                    !isSafe &&
                                    !isMyBanTurn &&
                                    "text-gray-600"
                                )}
                              >
                                {cls}
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
      )}
    </div>
  );
}

function TeamPanel({
  team,
  captain,
  players,
  realm,
  teamSize,
  isActive,
  turnLabel,
  isWinner,
  showWinner,
}: {
  team: number;
  captain?: {
    displayName: string;
    _id: Id<"draftPlayers">;
    discordUserId: string;
    avatarUrl?: string;
    selectedClass?: string;
  } | null;
  players: {
    _id: Id<"draftPlayers">;
    discordUserId: string;
    displayName: string;
    pickOrder?: number;
    avatarUrl?: string;
    selectedClass?: string;
  }[];
  realm?: string;
  teamSize: number;
  isActive: boolean;
  turnLabel?: string;
  isWinner: boolean;
  showWinner: boolean;
}) {
  const isT2 = team === 2;
  const slots = teamSize - 1;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-1.5 transition-all duration-300 relative overflow-hidden",
        isActive && !isT2 && "border-gray-600 bg-gray-800/60",
        isActive && isT2 && "border-indigo-500/40 bg-indigo-900/15",
        !isActive && "border-gray-700 bg-gray-800/50",
        showWinner && isWinner && !isT2 && "ring-1 ring-gray-500/30",
        showWinner && isWinner && isT2 && "ring-1 ring-indigo-500/30"
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "absolute top-0 left-0 right-0 h-0.5 origin-left",
              isT2 ? "bg-indigo-500" : "bg-gray-400"
            )}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "text-xs font-medium",
            isT2 ? "text-indigo-400" : "text-gray-400"
          )}
        >
          Team {team}
        </span>
        <div className="flex items-center gap-1.5">
          {realm && (
            <Badge
              variant={isT2 ? "default" : "secondary"}
              className="text-[9px]"
            >
              {realm}
            </Badge>
          )}
          {showWinner && isWinner && (
            <Badge variant="winner" className="text-[9px]">
              Winner
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded px-2.5 py-1.5 text-[11px] font-medium mb-1 transition-all duration-200",
          turnLabel
            ? isT2
              ? "bg-indigo-500/10 text-indigo-300"
              : "bg-gray-700/30 text-gray-300"
            : "bg-transparent text-transparent"
        )}
      >
        {turnLabel && (
          <motion.div
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              isT2 ? "bg-indigo-400" : "bg-gray-400"
            )}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {turnLabel || "\u00A0"}
      </div>

      {captain && (
        <div
          className={cn(
            "flex items-center justify-between rounded px-2.5 py-1.5 text-sm",
            isT2
              ? "bg-indigo-900/20 text-indigo-300"
              : "bg-gray-800/50 text-gray-300"
          )}
        >
          <div className="flex items-center gap-2">
            <PlayerAvatar
              url={captain.avatarUrl}
              name={captain.displayName}
              size={18}
            />
            <span className="font-medium text-xs">{captain.displayName}</span>
          </div>
          <span
            className={cn(
              "text-[9px] uppercase tracking-wider opacity-60",
              isT2 ? "text-indigo-400" : "text-gray-500"
            )}
          >
            Cpt
          </span>
        </div>
      )}
      {!captain && (
        <div className="rounded border border-dashed border-gray-700 px-2.5 py-1.5 text-xs text-gray-600">
          Captain
        </div>
      )}

      <AnimatePresence>
        {players.map((p) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, x: isT2 ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "flex items-center justify-between rounded px-2.5 py-1.5 text-xs",
              isT2
                ? "bg-indigo-900/10 text-indigo-200/80"
                : "bg-gray-800/40 text-gray-300"
            )}
          >
            <div className="flex items-center gap-2">
              <PlayerAvatar url={p.avatarUrl} name={p.displayName} size={16} />
              <span>{p.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">#{p.pickOrder}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {Array.from({ length: Math.max(0, slots - players.length) }).map(
        (_, i) => (
          <div
            key={`e-${i}`}
            className="rounded border border-dashed border-gray-700/40 px-2.5 py-1.5 text-xs text-gray-700"
          >
            --
          </div>
        )
      )}
    </div>
  );
}

function PlayerPool({
  players,
  isSetup,
  isDrafting,
  isCreator,
  isMyPickTurn,
  currentPickCaptainName,
  needsCaptain1,
  needsCaptain2,
  busy,
  onAssignCaptain,
  onPickPlayer,
}: {
  players: {
    _id: Id<"draftPlayers">;
    discordUserId: string;
    displayName: string;
    avatarUrl?: string;
  }[];
  isSetup: boolean;
  isDrafting: boolean;
  isCreator: boolean;
  isMyPickTurn: boolean;
  currentPickCaptainName?: string;
  needsCaptain1: boolean;
  needsCaptain2: boolean;
  busy: boolean;
  onAssignCaptain: (discordUserId: string, team: 1 | 2) => void;
  onPickPlayer: (playerId: Id<"draftPlayers">) => void;
}) {
  const selectingCaptain = isSetup && isCreator && (needsCaptain1 || needsCaptain2);
  const canInteract = selectingCaptain || (isDrafting && isMyPickTurn);

  let captainLabel = "";
  if (needsCaptain1 && isCreator) {
    captainLabel = "Select Team 1 Captain";
  } else if (needsCaptain2 && isCreator) {
    captainLabel = "Select Team 2 Captain";
  }

  let hint = "";
  if (isDrafting && isMyPickTurn) {
    hint = "Your pick";
  } else if (isDrafting && currentPickCaptainName) {
    hint = `${currentPickCaptainName}'s pick`;
  }

  const sortedPlayers = [...players].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
  const emptyState = getPlayerPoolEmptyState({
    playersCount: players.length,
    isSetup,
    isDrafting,
  });

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg p-2 transition-all duration-300 relative overflow-hidden",
        selectingCaptain && "bg-gray-800/40 ring-1 ring-indigo-500/20"
      )}
    >
      <AnimatePresence>
        {selectingCaptain && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-0.5 origin-center bg-indigo-500/60"
          />
        )}
      </AnimatePresence>

      {emptyState.topNotice && (
        <div className="text-center py-2">
          <span className="text-[10px] text-gray-600">{emptyState.topNotice}</span>
        </div>
      )}

      <AnimatePresence>
        {captainLabel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2 rounded bg-indigo-500/10 px-2.5 py-1.5"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[11px] text-indigo-300 font-medium">
              {captainLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {hint && (
        <p className="text-[10px] text-gray-600 text-center">{hint}</p>
      )}
      <div className="space-y-1">
        <AnimatePresence>
          {sortedPlayers.map((p) => (
            <motion.button
              key={p._id}
              layout
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              transition={{ duration: 0.2 }}
              disabled={!canInteract || busy}
              onClick={() => {
                if (isSetup && needsCaptain1) {
                  onAssignCaptain(p.discordUserId, 1);
                } else if (isSetup && needsCaptain2) {
                  onAssignCaptain(p.discordUserId, 2);
                } else if (isDrafting) {
                  onPickPlayer(p._id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium transition-all",
                canInteract
                  ? "bg-gray-800 border border-gray-700 text-gray-300 hover:border-indigo-500/40 hover:text-white hover:bg-gray-700 cursor-pointer"
                  : "bg-gray-800/40 border border-gray-700/40 text-gray-600"
              )}
            >
              <PlayerAvatar url={p.avatarUrl} name={p.displayName} size={18} />
              <span>{p.displayName}</span>
            </motion.button>
          ))}
        </AnimatePresence>
        {emptyState.listEmptyLabel && (
          <p className="text-center text-[10px] text-gray-600 py-4">
            {emptyState.listEmptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}

function MatchCenterScore({ score }: { score: string }) {
  return (
    <div className="px-4 py-4">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Final score</p>
        <p className="text-lg font-semibold text-gray-100 tabular-nums">{score}</p>
      </div>
    </div>
  );
}

function FightClassSetup({
  fightNumber,
  team1,
  team2,
  fights,
  allPlayers,
  linkedProfiles,
  classOptions,
  bannedClassNames,
  canEditClasses,
  editableTeam,
  canRecordWinner,
  busy,
  onSetPlayerClass,
  onSetFightPlayerClass,
  canRecordFight,
  isClassSnapshotReady,
  onRecordWinner,
  onUpdateFightWinner,
  pendingSetWinnerTeam,
  displayedSetScore,
  isCreatorView,
  onFinalizeSet,
}: {
  fightNumber: number;
  team1: { label: string; players: DraftData["players"] };
  team2: { label: string; players: DraftData["players"] };
  fights: DraftData["fights"];
  allPlayers: DraftData["players"];
  linkedProfiles: Record<string, LinkedProfileSummary>;
  classOptions: string[];
  bannedClassNames: string[];
  canEditClasses: boolean;
  editableTeam: 1 | 2 | null;
  canRecordWinner: boolean;
  busy: boolean;
  onSetPlayerClass: (playerId: Id<"draftPlayers">, className: string) => void;
  onSetFightPlayerClass?: (
    fightNumber: number,
    playerId: Id<"draftPlayers">,
    className: string
  ) => void;
  canRecordFight: boolean;
  isClassSnapshotReady: boolean;
  onRecordWinner: (winnerTeam: 1 | 2) => void;
  onUpdateFightWinner: (fightNumber: number, winnerTeam: 1 | 2) => void;
  pendingSetWinnerTeam?: 1 | 2;
  displayedSetScore?: string;
  isCreatorView?: boolean;
  onFinalizeSet?: () => void;
}) {
  const [viewFightIndex, setViewFightIndex] = useState(fights.length);
  const [pendingWinnerTeam, setPendingWinnerTeam] = useState<1 | 2 | null>(null);
  const [pendingWinnerEdit, setPendingWinnerEdit] = useState<{
    fightNumber: number;
    from: 1 | 2;
    to: 1 | 2;
  } | null>(null);
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1);
  const [activePlayerId, setActivePlayerId] = useState<Id<"draftPlayers"> | null>(
    team1.players[0]?._id ?? team2.players[0]?._id ?? null
  );
  const bannedSet = useMemo(() => new Set(bannedClassNames), [bannedClassNames]);
  const playerById = useMemo(
    () => new Map(allPlayers.map((player) => [String(player._id), player])),
    [allPlayers]
  );

  const maxViewFightIndex = getFightSetupMaxViewFightIndex({
    allowCurrentFightView: true,
    canRecordFight,
    canEditClasses,
    fightsLength: fights.length,
  });

  useEffect(() => {
    setViewFightIndex(maxViewFightIndex);
  }, [maxViewFightIndex]);

  useEffect(() => {
    const teamPlayers = activeTeam === 1 ? team1.players : team2.players;
    if (teamPlayers.some((player) => player._id === activePlayerId)) {
      return;
    }
    const fallback = teamPlayers[0]?._id ?? (activeTeam === 1 ? team2.players[0]?._id : team1.players[0]?._id) ?? null;
    setActivePlayerId(fallback);
  }, [activePlayerId, activeTeam, team1.players, team2.players]);

  const activePlayer =
    team1.players.find((player) => player._id === activePlayerId) ??
    team2.players.find((player) => player._id === activePlayerId) ??
    null;
  const activePlayerOwnedClasses = useMemo(() => {
    if (!activePlayer) return {} as Record<string, HighestRankByClassEntry>;
    return linkedProfiles[activePlayer.discordUserId]?.highestRankByClass ?? {};
  }, [activePlayer, linkedProfiles]);
  const activePlayerOwnedClassesByRealm = useMemo(() => {
    if (!activePlayer) return {} as Record<string, HighestRankByClassEntry>;
    return linkedProfiles[activePlayer.discordUserId]?.highestRankByClassRealm ?? {};
  }, [activePlayer, linkedProfiles]);
  const activePlayerTeam = activePlayer
    ? team1.players.some((player) => player._id === activePlayer._id)
      ? 1
      : 2
    : null;
  const viewingRecordedFight = fights.length > 0 && viewFightIndex < fights.length;
  const viewedFight = viewingRecordedFight ? fights[viewFightIndex] : null;
  const viewedWinnerTeam = viewedFight?.winnerTeam;
  const waitingOnTeams = useMemo(() => {
    if (isClassSnapshotReady || viewingRecordedFight) return [] as number[];
    const team1NeedsClasses = team1.players.some(
      (player) =>
        typeof playerById.get(String(player._id))?.selectedClass !== "string" ||
        playerById.get(String(player._id))?.selectedClass?.length === 0
    );
    const team2NeedsClasses = team2.players.some(
      (player) =>
        typeof playerById.get(String(player._id))?.selectedClass !== "string" ||
        playerById.get(String(player._id))?.selectedClass?.length === 0
    );
    const pending: number[] = [];
    if (team1NeedsClasses) pending.push(1);
    if (team2NeedsClasses) pending.push(2);
    return pending;
  }, [isClassSnapshotReady, playerById, team1.players, team2.players, viewingRecordedFight]);

  const displayClassForPlayer = useCallback(
    (player: DraftData["players"][number]) => {
      if (!viewedFight) return player.selectedClass;
      return (
        viewedFight.classesByPlayer.find(
          (entry) => String(entry.playerId) === String(player._id)
        )?.className ?? player.selectedClass
      );
    },
    [viewedFight]
  );
  const activePlayerDisplayedClass = activePlayer
    ? displayClassForPlayer(activePlayer)
    : undefined;

  const setClassAndAdvance = useCallback(
    (playerId: Id<"draftPlayers">, className: string) => {
      const activeTeamPlayers = activePlayerTeam === 1 ? team1.players : team2.players;
      const currentIndex = activeTeamPlayers.findIndex(
        (player) => player._id === playerId
      );
      const nextPlayer =
        currentIndex >= 0 && currentIndex < activeTeamPlayers.length - 1
          ? activeTeamPlayers[currentIndex + 1]
          : null;
      if (viewingRecordedFight && viewedFight && onSetFightPlayerClass) {
        onSetFightPlayerClass(viewedFight.fightNumber, playerId, className);
      } else {
        onSetPlayerClass(playerId, className);
      }
      if (nextPlayer) {
        setActivePlayerId(nextPlayer._id);
      }
    },
    [
      activePlayerTeam,
      onSetFightPlayerClass,
      onSetPlayerClass,
      team1.players,
      team2.players,
      viewedFight,
      viewingRecordedFight,
    ]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center py-1">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            {pendingSetWinnerTeam ? "Final score" : "Current score"}
          </p>
          <p className="text-base font-semibold text-gray-100 tabular-nums">
            {displayedSetScore}
          </p>
        </div>
      </div>
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-3">
      <div className="relative min-h-[32px]">
        <div className="text-left pr-16">
          <p className="text-sm font-semibold text-gray-100">
            Fight {viewingRecordedFight ? viewedFight?.fightNumber : fightNumber}
          </p>
        </div>
        <div className="absolute right-0 top-0 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewFightIndex((index) => Math.max(0, index - 1))}
            disabled={viewFightIndex <= 0}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded border",
              viewFightIndex <= 0
                ? "border-gray-700/40 text-gray-600 cursor-not-allowed"
                : "border-gray-600 text-gray-300 hover:bg-gray-700/40"
            )}
            aria-label="Previous fight"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewFightIndex((index) => Math.min(maxViewFightIndex, index + 1))
            }
            disabled={viewFightIndex >= maxViewFightIndex}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded border",
              viewFightIndex >= maxViewFightIndex
                ? "border-gray-700/40 text-gray-600 cursor-not-allowed"
                : "border-gray-600 text-gray-300 hover:bg-gray-700/40"
            )}
            aria-label="Next fight"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { team: 1 as const, data: team1 },
          { team: 2 as const, data: team2 },
        ].map(({ team, data }) => (
          <div
            key={team}
            className={cn(
              "rounded border p-2.5 space-y-2",
              team === 1
                ? "border-slate-500/40 bg-slate-900/20"
                : "border-indigo-500/40 bg-indigo-900/15"
            )}
          >
            <div className="flex items-center justify-between">
              <p className={cn("text-xs font-medium", team === 1 ? "text-slate-200" : "text-indigo-200")}>
                Team {team}
              </p>
              {viewingRecordedFight && viewedWinnerTeam === team ? (
                <Badge variant="winner" className="text-[9px]">
                  Winner
                </Badge>
              ) : (
                <Badge variant="winner" className="text-[9px] opacity-0 pointer-events-none">
                  Winner
                </Badge>
              )}
            </div>
            {data.players.map((player) => (
              <button
                type="button"
                key={player._id}
                onClick={() => {
                  setActiveTeam(team);
                  setActivePlayerId(player._id);
                }}
                className={cn(
                  "w-full grid grid-cols-[20px_1fr_22px_88px] items-center gap-2 rounded border px-2 py-1.5 text-left transition-colors",
                  activePlayerId === player._id
                    ? team === 1
                      ? "border-slate-300/60 bg-slate-700/20"
                      : "border-indigo-400/60 bg-indigo-500/15"
                    : team === 1
                      ? "border-slate-500/30 bg-slate-900/20 hover:border-slate-400/60"
                      : "border-indigo-500/30 bg-indigo-900/10 hover:border-indigo-400/60"
                )}
                disabled={canEditClasses && editableTeam !== null && editableTeam !== team}
              >
                <PlayerAvatar
                  url={player.avatarUrl}
                  name={player.displayName}
                  size={16}
                />
                <span className="truncate text-xs text-gray-300">
                  {player.displayName}
                  {player.isCaptain ? (
                    <span className="ml-1 text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                      C
                    </span>
                  ) : null}
                </span>
                {linkedProfiles[player.discordUserId] ? (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={linkedProfiles[player.discordUserId].characterListUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex justify-center text-indigo-300 hover:text-indigo-200"
                          aria-label="Open character list"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>View user character list</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span />
                )}
                <span
                  className={cn(
                    "truncate text-[10px]",
                    team === 1 ? "text-slate-300/90" : "text-indigo-300/90"
                  )}
                >
                  {displayClassForPlayer(player) ?? "No class"}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {canEditClasses && (
      <div className="rounded border border-gray-700/50 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-600 shrink-0">
            Select class for
          </span>
          {activePlayer ? (
            <>
              <PlayerAvatar
                url={activePlayer.avatarUrl}
                name={activePlayer.displayName}
                size={16}
              />
              <span className="text-xs font-medium text-gray-200">
                {activePlayer.displayName}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-600">—</span>
          )}
        </div>
        <div className="space-y-2">
          {(Object.entries(CLASS_CATEGORIES) as [ClassCategory, string[]][]).map(
            ([category, classes]) => {
              const hasAny = REALMS.some((realm) =>
                classes.some(
                  (className) =>
                    classOptions.includes(className) &&
                    (classesByRealm[realm] || []).includes(className)
                )
              );
              if (!hasAny) return null;
              const canPickClass =
                canEditClasses &&
                !busy &&
                !!activePlayer &&
                activePlayerTeam !== null &&
                editableTeam !== null &&
                activePlayerTeam === editableTeam;
              return (
                <div key={category} className="flex items-start gap-2">
                  <span className="w-16 shrink-0 pt-1.5 text-[10px] uppercase tracking-wider font-medium text-gray-500">
                    {category}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {REALMS.map((realm) => {
                      const realmClasses = classes
                        .filter(
                          (className) =>
                            classOptions.includes(className) &&
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
                          key={`${category}-${realm}`}
                          className={cn(
                            "flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
                            groupBg
                          )}
                        >
                          {realmClasses.map((className) => {
                            const isBanned = bannedSet.has(className);
                            const isSelected = activePlayerDisplayedClass === className;
                            const classAppearsInMultipleRealms = realmsForClass(className).length > 1;
                            const realmAwareMeta =
                              activePlayerOwnedClassesByRealm[
                                `${realm}:${toCanonicalDraftClassName(className)}`
                              ];
                            const ownedClassMeta = classAppearsInMultipleRealms
                              ? realmAwareMeta
                              : realmAwareMeta ??
                                activePlayerOwnedClasses[toCanonicalDraftClassName(className)];
                            const classButton = (
                              <button
                                key={className}
                                type="button"
                                disabled={!canPickClass || isBanned}
                                onClick={() =>
                                  activePlayer &&
                                  setClassAndAdvance(activePlayer._id, className)
                                }
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                                  isBanned && "text-gray-600 line-through",
                                  !isBanned &&
                                    isSelected &&
                                    "bg-gray-700/70 text-white",
                                  !isBanned &&
                                    !isSelected &&
                                    canPickClass &&
                                    "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer",
                                  !isBanned &&
                                    !isSelected &&
                                    !canPickClass &&
                                    "text-gray-600",
                                  ownedClassMeta &&
                                    !isBanned &&
                                    "border-b border-indigo-400/60"
                                )}
                              >
                                {className}
                              </button>
                            );
                            if (ownedClassMeta && !isBanned) {
                              return (
                                <TooltipProvider key={className} delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      {classButton}
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="px-2 py-1 text-[10px]"
                                    >
                                      <span className="text-indigo-200">
                                        {ownedClassMeta.formattedRank}
                                      </span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            }
                            return classButton;
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
      )}

      {canRecordWinner && (viewingRecordedFight || !pendingSetWinnerTeam) && (
        <div className="space-y-2">
          {isCreatorView && !viewingRecordedFight && !isClassSnapshotReady && waitingOnTeams.length > 0 ? (
            <p className="text-center text-[10px] font-medium tracking-wide text-indigo-300">
              {waitingOnTeams.length === 2
                ? `Waiting for ${team1.label} and ${team2.label} to finish assigning classes to their teams.`
                : waitingOnTeams[0] === 1
                  ? `Waiting for ${team1.label} to finish assigning classes to their team.`
                  : `Waiting for ${team2.label} to finish assigning classes to their team.`}
            </p>
          ) : null}
          <p className="text-center text-[10px] font-medium tracking-wide text-gray-500">
            {viewingRecordedFight ? "Change winner" : "Select winner"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={
                viewingRecordedFight
                  ? busy
                  : busy || !canRecordFight || !isClassSnapshotReady
              }
              onClick={() => {
                if (viewingRecordedFight && viewedFight) {
                  if (viewedFight.winnerTeam !== 1) {
                    setPendingWinnerEdit({
                      fightNumber: viewedFight.fightNumber,
                      from: viewedFight.winnerTeam,
                      to: 1,
                    });
                  }
                  return;
                }
                setPendingWinnerTeam(1);
              }}
              className={cn(
                "min-w-[110px] inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-1.5 text-xs font-medium transition-all",
                viewingRecordedFight && viewedFight?.winnerTeam === 1
                  ? "border-slate-400/60 bg-slate-600/40 text-white"
                  : viewingRecordedFight
                    ? "border-slate-500/40 text-slate-300 hover:bg-slate-700/30"
                    : busy || !canRecordFight || !isClassSnapshotReady
                      ? "border-gray-700/50 text-gray-600 cursor-not-allowed"
                      : "border-slate-500/40 text-slate-300 hover:bg-slate-700/30"
              )}
            >
              {viewingRecordedFight && viewedFight?.winnerTeam === 1 ? (
                <Check className="h-3 w-3 opacity-80" />
              ) : null}
              <span>Team 1</span>
            </button>
            <button
              type="button"
              disabled={
                viewingRecordedFight
                  ? busy
                  : busy || !canRecordFight || !isClassSnapshotReady
              }
              onClick={() => {
                if (viewingRecordedFight && viewedFight) {
                  if (viewedFight.winnerTeam !== 2) {
                    setPendingWinnerEdit({
                      fightNumber: viewedFight.fightNumber,
                      from: viewedFight.winnerTeam,
                      to: 2,
                    });
                  }
                  return;
                }
                setPendingWinnerTeam(2);
              }}
              className={cn(
                "min-w-[110px] inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-1.5 text-xs font-medium transition-all",
                viewingRecordedFight && viewedFight?.winnerTeam === 2
                  ? "border-indigo-400/60 bg-indigo-500/30 text-white"
                  : viewingRecordedFight
                    ? "border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20"
                    : busy || !canRecordFight || !isClassSnapshotReady
                      ? "border-gray-700/50 text-gray-600 cursor-not-allowed"
                      : "border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20"
              )}
            >
              {viewingRecordedFight && viewedFight?.winnerTeam === 2 ? (
                <Check className="h-3 w-3 opacity-80" />
              ) : null}
              <span>Team 2</span>
            </button>
          </div>
        </div>
      )}

      {pendingSetWinnerTeam && canRecordWinner && (
        <div className="flex items-center justify-between border-t border-gray-700/60 pt-3">
          <p className="text-xs text-gray-400">
            Team {pendingSetWinnerTeam} wins the set
          </p>
          {isCreatorView && onFinalizeSet ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={onFinalizeSet}
            >
              Finalize Set
            </Button>
          ) : (
            <span className="text-xs text-gray-600">
              Waiting for creator
            </span>
          )}
        </div>
      )}
    </div>

      {pendingWinnerTeam !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPendingWinnerTeam(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
            <div className="px-5 pt-5 pb-4">
              <p className="text-sm font-medium text-white">Fight {fightNumber} winner</p>
              <p className="mt-1 text-sm text-gray-400">Team {pendingWinnerTeam}</p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button
                type="button"
                onClick={() => setPendingWinnerTeam(null)}
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingWinnerTeam) onRecordWinner(pendingWinnerTeam);
                  setPendingWinnerTeam(null);
                }}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingWinnerEdit !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPendingWinnerEdit(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
            <div className="px-5 pt-5 pb-4">
              <p className="text-sm font-medium text-white">Change Fight {pendingWinnerEdit.fightNumber} winner</p>
              <p className="mt-1 text-sm text-gray-400">Team {pendingWinnerEdit.from} &rarr; Team {pendingWinnerEdit.to}</p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button
                type="button"
                onClick={() => setPendingWinnerEdit(null)}
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateFightWinner(
                    pendingWinnerEdit.fightNumber,
                    pendingWinnerEdit.to
                  );
                  setPendingWinnerEdit(null);
                }}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
