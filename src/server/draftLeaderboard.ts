import { ConvexHttpClient } from "convex/browser";
import prisma from "../../prisma/prismaClient";

export type DraftLeaderboardPlayer = {
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: 1 | 2;
  isCaptain: boolean;
};

export type DraftLeaderboardDraft = {
  shortId: string;
  type: "traditional" | "pvp";
  discordGuildId: string;
  winnerTeam?: 1 | 2;
  resultStatus?: "unverified" | "verified" | "voided";
  _creationTime?: number;
  team1Realm?: string;
  team2Realm?: string;
  players: DraftLeaderboardPlayer[];
};

export type DraftLeaderboardRow = {
  id: string;
  clerkUserId: string;
  isVerified: boolean;
  userName: string;
  avatarUrl?: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
  captainWins: number;
  captainLosses: number;
  captainGames: number;
  captainWinRate: number;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function aggregateDraftLeaderboardRows(
  drafts: DraftLeaderboardDraft[],
  clerkByDiscordUserId: Map<string, string>,
  userNameByClerkUserId: Map<string, string>
): DraftLeaderboardRow[] {
  const stats = new Map<
    string,
    {
      clerkUserId: string;
      isVerified: boolean;
      wins: number;
      losses: number;
      captainWins: number;
      captainLosses: number;
      latestDisplayNameCreatedAt: number;
      displayName: string;
      latestAvatarCreatedAt: number;
      avatarUrl?: string;
    }
  >();

  for (const draft of drafts) {
    if (draft.resultStatus !== "verified" || draft.winnerTeam === undefined) {
      continue;
    }

    for (const player of draft.players) {
      if (player.team === undefined) {
        continue;
      }

      const clerkUserId = clerkByDiscordUserId.get(player.discordUserId);
      const rowId = clerkUserId ?? `discord:${player.discordUserId}`;
      const isVerified = Boolean(clerkUserId);
      const fallbackName = player.displayName?.trim() || player.discordUserId;

      const entry = stats.get(rowId) ?? {
        clerkUserId: clerkUserId ?? rowId,
        isVerified,
        wins: 0,
        losses: 0,
        captainWins: 0,
        captainLosses: 0,
        latestDisplayNameCreatedAt: -1,
        displayName: fallbackName,
        latestAvatarCreatedAt: -1,
        avatarUrl: undefined,
      };
      const isWin = player.team === draft.winnerTeam;
      if (isWin) {
        entry.wins += 1;
        if (player.isCaptain) {
          entry.captainWins += 1;
        }
      } else {
        entry.losses += 1;
        if (player.isCaptain) {
          entry.captainLosses += 1;
        }
      }
      if (
        fallbackName &&
        typeof draft._creationTime === "number" &&
        draft._creationTime >= entry.latestDisplayNameCreatedAt
      ) {
        entry.latestDisplayNameCreatedAt = draft._creationTime;
        entry.displayName = fallbackName;
      }
      if (
        player.avatarUrl &&
        typeof draft._creationTime === "number" &&
        draft._creationTime >= entry.latestAvatarCreatedAt
      ) {
        entry.latestAvatarCreatedAt = draft._creationTime;
        entry.avatarUrl = player.avatarUrl;
      }
      stats.set(rowId, entry);
    }
  }

  return Array.from(stats.entries())
    .map(([id, value]) => {
      const games = value.wins + value.losses;
      const captainGames = value.captainWins + value.captainLosses;
      const userName =
        value.isVerified
          ? (userNameByClerkUserId.get(value.clerkUserId) ?? value.displayName)
          : value.displayName;
      return {
        id,
        clerkUserId: value.clerkUserId,
        isVerified: value.isVerified,
        userName,
        avatarUrl: value.avatarUrl,
        wins: value.wins,
        losses: value.losses,
        games,
        winRate: games > 0 ? Math.round((value.wins / games) * 1000) / 10 : 0,
        captainWins: value.captainWins,
        captainLosses: value.captainLosses,
        captainGames,
        captainWinRate:
          captainGames > 0
            ? Math.round((value.captainWins / captainGames) * 1000) / 10
            : 0,
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.games - a.games;
    });
}

export async function getDraftLeaderboardRows(): Promise<DraftLeaderboardRow[]> {
  const convex = getConvexClient();
  const drafts = (await convex.query("drafts:getVerifiedDraftResults" as any, {})) as DraftLeaderboardDraft[];

  const identityLinks = await prisma.userIdentityLink.findMany({
    where: {
      provider: "discord",
      status: "linked",
    },
    select: {
      providerUserId: true,
      clerkUserId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const clerkByDiscordUserId = new Map<string, string>();
  const userNameByClerkUserId = new Map<string, string>();

  for (const link of identityLinks) {
    clerkByDiscordUserId.set(link.providerUserId, link.clerkUserId);
    userNameByClerkUserId.set(
      link.clerkUserId,
      link.user.name && link.user.name.trim() ? link.user.name : link.clerkUserId
    );
  }

  return aggregateDraftLeaderboardRows(
    drafts,
    clerkByDiscordUserId,
    userNameByClerkUserId
  );
}
