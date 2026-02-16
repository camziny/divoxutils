"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DraftData, CurrentPlayer } from "../types";
import DraftBoard from "./components/DraftBoard";

export default function DraftClient({
  shortId,
  token,
}: {
  shortId: string;
  token?: string;
}) {
  const draft = useQuery(api.drafts.getDraft, { shortId });
  const currentPlayer = useQuery(
    api.drafts.getPlayerByToken,
    token ? { token } : "skip"
  );

  if (draft === undefined) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-gray-400" />
      </div>
    );
  }

  if (draft === null) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-gray-600">Draft not found</p>
      </div>
    );
  }

  const isCreator = currentPlayer?.discordUserId === draft.createdBy;

  return (
    <DraftBoard
      draft={draft as unknown as DraftData}
      currentPlayer={(currentPlayer as unknown as CurrentPlayer) || null}
      isCreator={isCreator}
      token={token}
    />
  );
}
