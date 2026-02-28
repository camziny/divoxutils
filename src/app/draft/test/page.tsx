"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DraftClient from "../[id]/DraftClient";
import DiscordIdentityLinkCard from "../../draft-history/DiscordIdentityLinkCard";

const DUMMY_NAMES = [
  "divox",
  "xuu",
  "dwal",
  "tom",
  "patar",
  "barbarianz",
  "farmacist",
  "saki",
  "venise",
  "torm",
  "ox",
  "fou",
  "lew",
  "reza",
  "hax",
  "triq",
  "vuu",
  "kwel",
];

export default function DraftTestPage() {
  const createDraft = useMutation(api.drafts.createDraft);
  const updateSettings = useMutation(api.drafts.updateSettings);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [lobbySize, setLobbySize] = useState(7);
  const [modePreset, setModePreset] = useState<"traditional" | "pvp">(
    "traditional"
  );
  const defaultTeamSize = Math.min(8, Math.max(2, Math.floor(lobbySize / 2)));

  const [draftState, setDraftState] = useState<{
    shortId: string;
    playerTokens: { discordUserId: string; token: string }[];
  } | null>(null);
  const [activeToken, setActiveToken] = useState<string | undefined>();
  const [manualOverride, setManualOverride] = useState(false);

  const draft = useQuery(
    api.drafts.getDraft,
    draftState ? { shortId: draftState.shortId } : "skip"
  );

  const tokenMap = useMemo(() => {
    if (!draftState) return new Map<string, string>();
    return new Map(
      draftState.playerTokens.map((pt) => [pt.discordUserId, pt.token])
    );
  }, [draftState]);

  const nameForToken = useMemo(() => {
    if (!draftState) return new Map<string, string>();
    const map = new Map<string, string>();
    draftState.playerTokens.forEach((pt, i) => {
      map.set(pt.token, DUMMY_NAMES[i] || `Player ${i + 1}`);
    });
    return map;
  }, [draftState]);

  const currentActorId = useMemo(() => {
    if (!draft) return undefined;
    if (draft.status === "setup") return draft.createdBy;
    if (draft.status === "coin_flip") return draft.coinFlipWinnerId ?? draft.createdBy;
    if (draft.status === "realm_pick") {
      const t1Has = !!draft.team1Realm;
      const t2Has = !!draft.team2Realm;
      let team: number;
      if (!t1Has && !t2Has) {
        team = draft.firstRealmPickTeam ?? 1;
      } else {
        team = draft.firstRealmPickTeam === 1 ? 2 : 1;
      }
      return team === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    }
    if (draft.status === "banning" && draft.banSequence && draft.currentBanIndex !== undefined) {
      const team = draft.banSequence[draft.currentBanIndex];
      return team === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    }
    if (draft.status === "drafting" && draft.pickSequence && draft.currentPickIndex !== undefined) {
      const team = draft.pickSequence[draft.currentPickIndex];
      return team === 1 ? draft.team1CaptainId : draft.team2CaptainId;
    }
    if (draft.status === "complete") return draft.createdBy;
    return undefined;
  }, [draft]);

  useEffect(() => {
    if (manualOverride || !currentActorId || !tokenMap.has(currentActorId)) return;
    const targetToken = tokenMap.get(currentActorId);
    if (targetToken && targetToken !== activeToken) {
      setActiveToken(targetToken);
    }
  }, [currentActorId, manualOverride, tokenMap, activeToken]);

  const handleSimulate = async () => {
    setCreateError(null);
    setIsCreating(true);
    try {
      const players = DUMMY_NAMES.slice(0, lobbySize).map((name, i) => ({
        discordUserId: `player_${i}`,
        displayName: name,
        avatarUrl:
          i % 3 === 0
            ? undefined
            : `https://cdn.discordapp.com/embed/avatars/${i % 5}.png`,
      }));

      const result = await createDraft({
        discordGuildId: "test-guild",
        discordChannelId: "test-channel",
        createdBy: "player_0",
        players,
      });

      const creatorToken = result.playerTokens.find(
        (p) => p.discordUserId === "player_0"
      )?.token;

      if (modePreset === "pvp" && creatorToken) {
        const adjustedTeamSize = Math.max(
          2,
          Math.min(8, Math.floor(players.length / 2))
        );
        await updateSettings({
          draftId: result.draftId,
          type: "pvp",
          teamSize: adjustedTeamSize,
          token: creatorToken,
        });
      }

      setDraftState({
        shortId: result.shortId,
        playerTokens: result.playerTokens,
      });
      setActiveToken(creatorToken);
      setManualOverride(false);
    } catch (error: any) {
      console.error("Failed to create test draft:", error);
      const message =
        typeof error?.message === "string" && error.message.trim().length > 0
          ? error.message
          : "Failed to create test draft.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const currentViewName = activeToken
    ? nameForToken.get(activeToken) ?? "Unknown"
    : "Spectator";

  if (draftState) {
    return (
      <div className="bg-gray-900 min-h-screen text-gray-300">
        <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-gray-600 font-medium shrink-0">
                Viewing as
              </span>
              <span className="text-sm font-medium text-white">
                {currentViewName}
              </span>
              {!manualOverride && (
                <span className="text-[10px] text-indigo-400/60 uppercase tracking-wider">
                  auto
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {manualOverride && (
                <button
                  onClick={() => setManualOverride(false)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Resume auto
                </button>
              )}
              <div className="flex gap-0.5">
                {draftState.playerTokens.map((pt, i) => {
                  const name = DUMMY_NAMES[i] || `P${i + 1}`;
                  const isActive = pt.token === activeToken;
                  return (
                    <button
                      key={pt.discordUserId}
                      onClick={() => {
                        setActiveToken(pt.token);
                        setManualOverride(true);
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
                      )}
                      title={name}
                    >
                      {name}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setActiveToken(undefined);
                    setManualOverride(true);
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                    activeToken === undefined
                      ? "bg-gray-700 text-white"
                      : "text-gray-600 hover:text-gray-400 hover:bg-gray-800"
                  )}
                >
                  Spec
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <DiscordIdentityLinkCard />
          <DraftClient
            shortId={draftState.shortId}
            token={activeToken}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <DiscordIdentityLinkCard />

        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Draft Test
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Simulate a draft with a custom lobby size and mode preset.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Default team size for this lobby: {defaultTeamSize}v{defaultTeamSize}
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">
              Lobby size
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[7, 10, 16].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setLobbySize(size)}
                  className={cn(
                    "rounded border px-2 py-1.5 text-xs",
                    lobbySize === size
                      ? "border-indigo-500/60 bg-indigo-600/20 text-indigo-200"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:text-gray-200"
                  )}
                >
                  {size} players
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">
              Mode preset
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "traditional", label: "Traditional" },
                { key: "pvp", label: "PvP (auto-adjust size)" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() =>
                    setModePreset(mode.key as "traditional" | "pvp")
                  }
                  className={cn(
                    "rounded border px-2 py-1.5 text-xs",
                    modePreset === mode.key
                      ? "border-indigo-500/60 bg-indigo-600/20 text-indigo-200"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:text-gray-200"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={isCreating}
          size="lg"
          className="w-full"
        >
          {isCreating ? "Creating..." : `Simulate ${modePreset} draft`}
        </Button>

        {createError && (
          <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-left text-xs text-red-300">
            {createError}
          </div>
        )}
      </div>
    </div>
  );
}
