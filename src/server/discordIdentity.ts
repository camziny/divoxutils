import { ConvexHttpClient } from "convex/browser";

type DraftParticipant = {
  discordUserId: string;
};

type DraftWithParticipants = {
  players: DraftParticipant[];
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function hasDraftParticipantWithDiscordUserId(
  drafts: DraftWithParticipants[],
  discordUserId: string
): boolean {
  const normalizedDiscordUserId = discordUserId.trim();
  if (!normalizedDiscordUserId) {
    return false;
  }

  for (const draft of drafts) {
    for (const player of draft.players) {
      if (player.discordUserId === normalizedDiscordUserId) {
        return true;
      }
    }
  }

  return false;
}

export async function hasVerifiedDraftParticipantByDiscordUserId(
  discordUserId: string
): Promise<boolean> {
  const convex = getConvexClient();
  const drafts = (await convex.query(
    "drafts:getVerifiedDraftResults" as any,
    {}
  )) as DraftWithParticipants[];

  return hasDraftParticipantWithDiscordUserId(drafts, discordUserId);
}
