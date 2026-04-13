import { ConvexHttpClient } from "convex/browser";

type DraftLiveStatus = "setup" | "coin_flip" | "realm_pick" | "banning" | "drafting" | "complete";

type ActiveDraftPlayer = {
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: 1 | 2;
};

type ActiveDraftRecord = {
  shortId: string;
  createdAtMs: number;
  status: DraftLiveStatus;
  gameStarted?: boolean;
  discordGuildId: string;
  discordGuildName?: string;
  discordTextChannelId?: string;
  team1CaptainId?: string;
  team2CaptainId?: string;
  botPostedLink?: boolean;
  players: ActiveDraftPlayer[];
};

export type LiveDraftRow = {
  shortId: string;
  href: string;
  createdAtMs: number;
  status: DraftLiveStatus;
  discordGuildName?: string;
  team1CaptainName: string;
  team1CaptainAvatarUrl?: string;
  team2CaptainName: string;
  team2CaptainAvatarUrl?: string;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

async function getPostedActiveDrafts(): Promise<ActiveDraftRecord[]> {
  try {
    const convex = getConvexClient();
    const drafts = (await convex.query(
      "drafts:getActiveDrafts" as any,
      {}
    )) as ActiveDraftRecord[];
    return drafts.filter((draft) => draft.botPostedLink);
  } catch {
    return [];
  }
}

function resolveTeamCaptain(
  players: ActiveDraftPlayer[],
  explicitCaptainId: string | undefined,
  team: 1 | 2
) {
  if (explicitCaptainId) {
    const byId = players.find((player) => player.discordUserId === explicitCaptainId);
    if (byId) return byId;
  }
  const byTeam = players.find((player) => player.team === team);
  if (byTeam) return byTeam;
  return null;
}

export async function getLiveDraftCount(): Promise<number> {
  const drafts = await getPostedActiveDrafts();
  return drafts.length;
}

export async function getLiveDraftRows(): Promise<LiveDraftRow[]> {
  const drafts = await getPostedActiveDrafts();

  return drafts
    .map((draft) => {
      const team1Captain = resolveTeamCaptain(draft.players, draft.team1CaptainId, 1);
      const team2Captain = resolveTeamCaptain(draft.players, draft.team2CaptainId, 2);
      return {
        shortId: draft.shortId,
        href: `/draft/${draft.shortId}`,
        createdAtMs: draft.createdAtMs,
        status: draft.status,
        discordGuildName: draft.discordGuildName,
        team1CaptainName: team1Captain?.displayName ?? "Team 1",
        team1CaptainAvatarUrl: team1Captain?.avatarUrl,
        team2CaptainName: team2Captain?.displayName ?? "Team 2",
        team2CaptainAvatarUrl: team2Captain?.avatarUrl,
      };
    });
}
