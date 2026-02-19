"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DraftClient from "../[id]/DraftClient";

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
  const [isCreating, setIsCreating] = useState(false);

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
    setIsCreating(true);
    try {
      const players = DUMMY_NAMES.map((name, i) => ({
        discordUserId: `player_${i}`,
        displayName: name,
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

      setDraftState({
        shortId: result.shortId,
        playerTokens: result.playerTokens,
      });
      setActiveToken(creatorToken);
      setManualOverride(false);
    } catch (error) {
      console.error("Failed to create test draft:", error);
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
                {draftState.playerTokens.slice(0, 8).map((pt, i) => {
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

        <div className="mx-auto max-w-5xl px-4 py-8">
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
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Draft Test
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Simulate a draft with {DUMMY_NAMES.length} players to test the
            flow.
          </p>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={isCreating}
          size="lg"
          className="w-full"
        >
          {isCreating ? "Creating..." : "Simulate Draft"}
        </Button>
      </div>
    </div>
  );
}
