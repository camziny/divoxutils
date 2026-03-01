"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DraftData, CurrentPlayer } from "../../types";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  REALMS,
  classesByRealm,
  allClasses,
  CLASS_CATEGORIES,
  ClassCategory,
} from "../../constants";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import DiscordIdentityLinkCard from "@/app/draft-history/DiscordIdentityLinkCard";
import { getPlayerPoolEmptyState } from "./playerPoolState";
import {
  getMaxSelectableTeamSize,
  isTeamSizeSelectable,
  toUserSettingsError,
} from "./settingsUtils";
import { User } from "lucide-react";

function PlayerAvatar({ url, name, size = 20 }: { url?: string; name?: string; size?: number }) {
  if (!url) {
    return (
      <div
        className="rounded-full shrink-0 bg-gray-700 text-gray-200 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <User size={Math.max(10, Math.floor(size * 0.6))} />
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={name ?? "Player avatar"}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      unoptimized
    />
  );
}

interface DraftBoardProps {
  draft: DraftData;
  currentPlayer: CurrentPlayer | null;
  isCreator: boolean;
  token?: string;
}

type PickOrderMode = "snake" | "alternating";

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
  const pickPlayer = useMutation(api.drafts.pickPlayer);
  const setWinner = useMutation(api.drafts.setWinner);
  const beginGame = useMutation(api.drafts.beginGame);
  const undoLastAction = useMutation(api.drafts.undoLastAction);

  const [busy, setBusy] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);
  const [autoAdjustedSettingsKey, setAutoAdjustedSettingsKey] = useState<string | null>(null);

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

  const team1Bans = draft.bans.filter((b) => b.team === 1);
  const team2Bans = draft.bans.filter((b) => b.team === 2);
  const bannedClassNames = draft.bans.map((b) => b.className);

  const isSetup = draft.status === "setup";
  const isCoinFlip = draft.status === "coin_flip";
  const isRealmPick = draft.status === "realm_pick";
  const isBanning = draft.status === "banning";
  const isDrafting = draft.status === "drafting";
  const isComplete = draft.status === "complete";

  const showBans = isBanning || isDrafting || isComplete;

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
      try {
        await fn();
      } catch (e) {
        console.error(e);
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
      pickOrderMode: PickOrderMode
    ) => {
      if (busy) return;
      setBusy(true);
      try {
        await (updateSettings as any)({
          draftId: draft._id,
          type,
          teamSize,
          pickOrderMode,
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
      draft.pickOrderMode ?? "snake"
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
    isCreator,
    isSetup,
    token,
  ]);

  const canUndo =
    isCreator &&
    token &&
    ((isBanning && (draft.currentBanIndex ?? 0) > 0) ||
      (isBanning && (draft.currentBanIndex ?? 0) === 0 && draft.bans.length > 0) ||
      (isDrafting && (draft.currentPickIndex ?? 0) > 0) ||
      (isDrafting && (draft.currentPickIndex ?? 0) === 0 && draft.bans.length > 0) ||
      (isComplete && !draft.gameStarted));

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
      />

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
                draft.pickOrderMode ?? "snake"
              );
            }
            return applySettings(
              type,
              draft.teamSize,
              draft.pickOrderMode ?? "snake"
            );
          }}
          onUpdateSize={(teamSize) => {
            setSettingsFeedback(null);
            return applySettings(
              draft.type,
              teamSize,
              draft.pickOrderMode ?? "snake"
            );
          }}
          onUpdatePickOrderMode={(pickOrderMode) => {
            setSettingsFeedback(null);
            return applySettings(draft.type, draft.teamSize, pickOrderMode);
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

      {isComplete && isCreator && !draft.gameStarted && (
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

      {isComplete && !isCreator && !draft.gameStarted && (
        <div className="flex justify-center pt-2">
          <span className="text-xs text-gray-600">
            Waiting for creator...
          </span>
        </div>
      )}

      {isComplete && isCreator && draft.gameStarted && !draft.winnerTeam && (
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              act(() =>
                setWinner({
                  draftId: draft._id,
                  winnerTeam: 1,
                  token: token!,
                })
              )
            }
          >
            Team 1 Wins
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              act(() =>
                setWinner({
                  draftId: draft._id,
                  winnerTeam: 2,
                  token: token!,
                })
              )
            }
          >
            Team 2 Wins
          </Button>
        </div>
      )}

      {isComplete && (
        <div className="pt-4">
          <DiscordIdentityLinkCard
            draftDiscordUserId={currentPlayer?.discordUserId}
          />
        </div>
      )}
    </div>
  );
}

function StatusBar({
  draft,
  undoButton,
}: {
  draft: DraftData;
  undoButton?: React.ReactNode;
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
    if (draft.winnerTeam) {
      subtitle = `Team ${draft.winnerTeam} wins`;
    } else if (draft.gameStarted) {
      subtitle = "Teams are set — good luck";
    } else {
      subtitle = "Draft complete";
    }
  }

  const isSetup = draft.status === "setup";

  return (
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
  onStart: () => void;
  canStart: boolean;
}) {
  const needsCaptains = !hasCaptain1 || !hasCaptain2;
  let buttonLabel = "Start Draft";
  if (!hasCaptain1) {
    buttonLabel = "Assign Captains";
  } else if (!hasCaptain2) {
    buttonLabel = "Assign Captain 2";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <Select
          value={draft.type}
          onValueChange={(v) => onUpdateType(v as "traditional" | "pvp")}
          disabled={busy}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs border-gray-700 bg-gray-800/60">
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
          <SelectTrigger className="h-8 w-[90px] text-xs border-gray-700 bg-gray-800/60">
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
            value={draft.pickOrderMode ?? "snake"}
            onValueChange={(v) => onUpdatePickOrderMode(v as PickOrderMode)}
            disabled={busy}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs border-gray-700 bg-gray-800/60">
              <span className="truncate">
                {(draft.pickOrderMode ?? "snake") === "alternating"
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
      </div>
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
                        Pick Players First
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
}) {
  let classesForBan: string[];
  if (draft.type === "traditional" && isBanning && currentBanTeam) {
    const opponentRealm =
      currentBanTeam === 1 ? draft.team2Realm! : draft.team1Realm!;
    classesForBan = classesByRealm[opponentRealm] || [];
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

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">Bans</span>
          {isBanning && (
            <span className="text-[10px] text-gray-600">
              {isMyBanTurn
                ? "Your ban"
                : `${banCurrentCaptain?.displayName}'s ban`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">T1:</span>
            {team1Bans.length > 0 ? (
              team1Bans.map((b) => (
                <Badge
                  key={b._id}
                  variant="secondary"
                  className="text-[10px] line-through opacity-70"
                >
                  {b.className}
                </Badge>
              ))
            ) : (
              <span className="text-[10px] text-gray-600">--</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-indigo-400/60">T2:</span>
            {team2Bans.length > 0 ? (
              team2Bans.map((b) => (
                <Badge
                  key={b._id}
                  variant="secondary"
                  className="text-[10px] line-through opacity-70"
                >
                  {b.className}
                </Badge>
              ))
            ) : (
              <span className="text-[10px] text-gray-600">--</span>
            )}
          </div>
        </div>
      </div>

      {isBanning && draft.type === "pvp" && (
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
                          return (
                            <button
                              key={banKey}
                              disabled={!isMyBanTurn || busy || isBanned}
                              onClick={() => onBan(banKey)}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                                isBanned &&
                                  "text-gray-600 line-through",
                                !isBanned &&
                                  isMyBanTurn &&
                                  "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer",
                                !isBanned &&
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

      {isBanning && draft.type !== "pvp" && (
        <div className="space-y-2">
          {(Object.entries(CLASS_CATEGORIES) as [ClassCategory, string[]][]).map(
            ([category, classes]) => {
              const relevantClasses = classes
                .filter((c) => classesForBan.includes(c))
                .sort((a, b) => a.localeCompare(b));
              if (relevantClasses.length === 0) return null;
              return (
                <div key={category} className="flex items-start gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium w-16 shrink-0 pt-1.5 text-gray-500">
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {relevantClasses.map((cls) => {
                      const isBanned = bannedClassNames.includes(cls);
                      return (
                        <button
                          key={cls}
                          disabled={!isMyBanTurn || busy || isBanned}
                          onClick={() => onBan(cls)}
                          className={cn(
                            "rounded border px-2 py-1 text-[11px] font-medium transition-all",
                            isBanned &&
                              "border-gray-700 bg-gray-800/40 text-gray-600 line-through opacity-50",
                            !isBanned &&
                              isMyBanTurn &&
                              "border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 cursor-pointer",
                            !isBanned &&
                              !isMyBanTurn &&
                              "border-gray-700/50 bg-gray-800/30 text-gray-600"
                          )}
                        >
                          {cls}
                        </button>
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
  captain?: { displayName: string; _id: Id<"draftPlayers">; avatarUrl?: string } | null;
  players: { _id: Id<"draftPlayers">; displayName: string; pickOrder?: number; avatarUrl?: string }[];
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
            <span className="text-[10px] text-gray-600">#{p.pickOrder}</span>
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
