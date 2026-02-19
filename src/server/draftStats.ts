import { ConvexHttpClient } from "convex/browser";
import prisma from "../../prisma/prismaClient";
import {
  aggregateDraftLeaderboardRows,
  DraftLeaderboardDraft,
  DraftLeaderboardRow,
} from "./draftLeaderboard";

export type DraftStatsFilters = {
  guildId?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  minGames?: number;
};

export type DraftCaptainRow = {
  clerkUserId: string;
  userName: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
};

export type DraftHeadToHeadRow = {
  playerClerkUserId: string;
  playerName: string;
  opponentClerkUserId: string;
  opponentName: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
};

type DraftIdentityContext = {
  drafts: DraftLeaderboardDraft[];
  clerkByDiscordUserId: Map<string, string>;
  userNameByClerkUserId: Map<string, string>;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function applyDraftStatsFilters(
  drafts: DraftLeaderboardDraft[],
  filters: DraftStatsFilters
): DraftLeaderboardDraft[] {
  return drafts.filter((draft) => {
    if (draft.resultStatus !== "verified" || draft.winnerTeam === undefined) {
      return false;
    }
    if (filters.guildId && draft.discordGuildId !== filters.guildId) {
      return false;
    }
    if (
      typeof filters.startTimeMs === "number" ||
      typeof filters.endTimeMs === "number"
    ) {
      if (typeof draft._creationTime !== "number") {
        return false;
      }
      if (
        typeof filters.startTimeMs === "number" &&
        draft._creationTime < filters.startTimeMs
      ) {
        return false;
      }
      if (
        typeof filters.endTimeMs === "number" &&
        draft._creationTime > filters.endTimeMs
      ) {
        return false;
      }
    }
    return true;
  });
}

export function aggregateOverallRows(
  drafts: DraftLeaderboardDraft[],
  clerkByDiscordUserId: Map<string, string>,
  userNameByClerkUserId: Map<string, string>,
  filters: DraftStatsFilters
): DraftLeaderboardRow[] {
  const filteredDrafts = applyDraftStatsFilters(drafts, filters);
  const rows = aggregateDraftLeaderboardRows(
    filteredDrafts,
    clerkByDiscordUserId,
    userNameByClerkUserId
  );
  const minGames = filters.minGames ?? 0;
  if (minGames <= 0) {
    return rows;
  }
  return rows.filter((row) => row.games >= minGames);
}

export function aggregateCaptainRows(
  overallRows: DraftLeaderboardRow[],
  minGames = 0
): DraftCaptainRow[] {
  return overallRows
    .map((row) => ({
      clerkUserId: row.clerkUserId,
      userName: row.userName,
      wins: row.captainWins,
      losses: row.captainLosses,
      games: row.captainGames,
      winRate: row.captainWinRate,
    }))
    .filter((row) => row.games >= minGames)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.games - a.games;
    });
}

export function aggregateHeadToHeadRow(
  drafts: DraftLeaderboardDraft[],
  clerkByDiscordUserId: Map<string, string>,
  userNameByClerkUserId: Map<string, string>,
  playerClerkUserId: string,
  opponentClerkUserId: string,
  filters: DraftStatsFilters
): DraftHeadToHeadRow | null {
  const filteredDrafts = applyDraftStatsFilters(drafts, filters);
  let wins = 0;
  let losses = 0;

  for (const draft of filteredDrafts) {
    let playerTeam: 1 | 2 | undefined;
    let opponentTeam: 1 | 2 | undefined;

    for (const participant of draft.players) {
      if (participant.team === undefined) {
        continue;
      }
      const clerkUserId = clerkByDiscordUserId.get(participant.discordUserId);
      if (!clerkUserId) {
        continue;
      }
      if (clerkUserId === playerClerkUserId) {
        playerTeam = participant.team;
      } else if (clerkUserId === opponentClerkUserId) {
        opponentTeam = participant.team;
      }
    }

    if (playerTeam === undefined || opponentTeam === undefined) {
      continue;
    }
    if (playerTeam === opponentTeam) {
      continue;
    }

    if (playerTeam === draft.winnerTeam) {
      wins += 1;
    } else {
      losses += 1;
    }
  }

  const games = wins + losses;
  if (games < (filters.minGames ?? 0)) {
    return null;
  }

  const playerName =
    userNameByClerkUserId.get(playerClerkUserId) ?? playerClerkUserId;
  const opponentName =
    userNameByClerkUserId.get(opponentClerkUserId) ?? opponentClerkUserId;

  return {
    playerClerkUserId,
    playerName,
    opponentClerkUserId,
    opponentName,
    wins,
    losses,
    games,
    winRate: games > 0 ? Math.round((wins / games) * 1000) / 10 : 0,
  };
}

async function loadDraftIdentityContext(): Promise<DraftIdentityContext> {
  const convex = getConvexClient();
  const drafts = (await convex.query(
    "drafts:getVerifiedDraftResults" as any,
    {}
  )) as DraftLeaderboardDraft[];

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

  return {
    drafts,
    clerkByDiscordUserId,
    userNameByClerkUserId,
  };
}

export async function getOverallDraftStats(filters: DraftStatsFilters) {
  const context = await loadDraftIdentityContext();
  return aggregateOverallRows(
    context.drafts,
    context.clerkByDiscordUserId,
    context.userNameByClerkUserId,
    filters
  );
}

export async function getCaptainDraftStats(filters: DraftStatsFilters) {
  const context = await loadDraftIdentityContext();
  const overallRows = aggregateOverallRows(
    context.drafts,
    context.clerkByDiscordUserId,
    context.userNameByClerkUserId,
    filters
  );
  return aggregateCaptainRows(overallRows, filters.minGames ?? 0);
}

export async function getHeadToHeadDraftStats(
  playerClerkUserId: string,
  opponentClerkUserId: string,
  filters: DraftStatsFilters
) {
  const context = await loadDraftIdentityContext();
  return aggregateHeadToHeadRow(
    context.drafts,
    context.clerkByDiscordUserId,
    context.userNameByClerkUserId,
    playerClerkUserId,
    opponentClerkUserId,
    filters
  );
}
