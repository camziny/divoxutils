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
  opponentIsVerified: boolean;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
};

export type DraftRecentGameRow = {
  shortId: string;
  discordGuildId: string;
  createdAtMs: number;
  didWin: boolean;
  wasCaptain: boolean;
  winnerTeam: 1 | 2;
  playerTeam: 1 | 2;
  team1CaptainName: string;
  team2CaptainName: string;
  draftType: "traditional" | "pvp";
  playerRealm?: string;
};

export type WinLossRecord = {
  wins: number;
  losses: number;
  games: number;
  winRate: number;
};

export type DraftPlayerDrilldown = {
  playerClerkUserId: string;
  isVerified: boolean;
  playerName: string;
  profileName?: string;
  avatarUrl?: string;
  overall: WinLossRecord;
  captain: WinLossRecord;
  byRealm: Record<string, WinLossRecord>;
  pvp: WinLossRecord;
  recentGames: DraftRecentGameRow[];
  headToHead: DraftHeadToHeadRow[];
};

export type DraftLogRow = {
  shortId: string;
  type: "traditional" | "pvp";
  discordGuildId: string;
  discordGuildName?: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  winnerTeam?: 1 | 2;
  resultStatus: "unverified" | "verified" | "voided";
  createdAtMs: number;
  team1Realm?: string;
  team2Realm?: string;
  players: Array<{
    discordUserId: string;
    displayName: string;
    avatarUrl?: string;
    team?: 1 | 2;
    isCaptain: boolean;
  }>;
  bans: Array<{
    team: 1 | 2;
    className: string;
  }>;
};

type DraftIdentityContext = {
  drafts: DraftLeaderboardDraft[];
  clerkByDiscordUserId: Map<string, string>;
  userNameByClerkUserId: Map<string, string>;
};

function toLeaderboardPlayerId(
  discordUserId: string,
  clerkByDiscordUserId: Map<string, string>
) {
  return clerkByDiscordUserId.get(discordUserId) ?? `discord:${discordUserId}`;
}

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
      const participantId = toLeaderboardPlayerId(
        participant.discordUserId,
        clerkByDiscordUserId
      );
      if (participantId === playerClerkUserId) {
        playerTeam = participant.team;
      } else if (participantId === opponentClerkUserId) {
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

  let playerName = userNameByClerkUserId.get(playerClerkUserId) ?? playerClerkUserId;
  let opponentName =
    userNameByClerkUserId.get(opponentClerkUserId) ?? opponentClerkUserId;
  for (const draft of filteredDrafts) {
    for (const participant of draft.players) {
      const participantId = toLeaderboardPlayerId(
        participant.discordUserId,
        clerkByDiscordUserId
      );
      if (participantId === playerClerkUserId && participant.displayName.trim()) {
        playerName = participant.displayName;
      }
      if (participantId === opponentClerkUserId && participant.displayName.trim()) {
        opponentName = participant.displayName;
      }
    }
  }

  return {
    playerClerkUserId,
    playerName,
    opponentClerkUserId,
    opponentName,
    opponentIsVerified: !opponentClerkUserId.startsWith("discord:"),
    wins,
    losses,
    games,
    winRate: games > 0 ? Math.round((wins / games) * 1000) / 10 : 0,
  };
}

function computeWinRate(wins: number, losses: number): WinLossRecord {
  const games = wins + losses;
  return {
    wins,
    losses,
    games,
    winRate: games > 0 ? Math.round((wins / games) * 1000) / 10 : 0,
  };
}

function resolvePlayerRealm(
  draft: DraftLeaderboardDraft,
  playerTeam: 1 | 2
): string | undefined {
  if (draft.type !== "traditional") return undefined;
  return playerTeam === 1 ? draft.team1Realm : draft.team2Realm;
}

export function aggregatePlayerDrilldown(
  drafts: DraftLeaderboardDraft[],
  clerkByDiscordUserId: Map<string, string>,
  userNameByClerkUserId: Map<string, string>,
  playerClerkUserId: string,
  filters: DraftStatsFilters,
  recentLimit = 20
): DraftPlayerDrilldown | null {
  const filteredDrafts = applyDraftStatsFilters(drafts, filters);
  const isVerified = !playerClerkUserId.startsWith("discord:");
  const profileName = userNameByClerkUserId.get(playerClerkUserId);
  let playerName = profileName ?? playerClerkUserId;

  let wins = 0;
  let losses = 0;
  let captainWins = 0;
  let captainLosses = 0;
  let pvpWins = 0;
  let pvpLosses = 0;
  const realmStats = new Map<string, { wins: number; losses: number }>();
  const recentGames: DraftRecentGameRow[] = [];
  const headToHeadStats = new Map<string, { wins: number; losses: number }>();
  const headToHeadNameById = new Map<string, string>();
  let avatarUrl: string | undefined;
  let latestAvatarCreatedAt = -1;
  let latestDisplayNameCreatedAt = -1;

  for (const draft of filteredDrafts) {
    let playerTeam: 1 | 2 | undefined;
    let wasCaptain = false;
    const opponentTeams = new Map<string, 1 | 2>();

    for (const participant of draft.players) {
      if (participant.team === undefined) {
        continue;
      }
      const participantId = toLeaderboardPlayerId(
        participant.discordUserId,
        clerkByDiscordUserId
      );
      if (participantId === playerClerkUserId) {
        playerTeam = participant.team;
        wasCaptain = participant.isCaptain;
        if (
          participant.displayName &&
          typeof draft._creationTime === "number" &&
          draft._creationTime >= latestDisplayNameCreatedAt
        ) {
          latestDisplayNameCreatedAt = draft._creationTime;
          playerName = participant.displayName;
        }
        if (
          participant.avatarUrl &&
          typeof draft._creationTime === "number" &&
          draft._creationTime >= latestAvatarCreatedAt
        ) {
          latestAvatarCreatedAt = draft._creationTime;
          avatarUrl = participant.avatarUrl;
        }
      } else {
        opponentTeams.set(participantId, participant.team);
        if (participant.displayName.trim()) {
          headToHeadNameById.set(participantId, participant.displayName);
        }
      }
    }

    if (playerTeam === undefined || draft.winnerTeam === undefined) {
      continue;
    }

    const didWin = playerTeam === draft.winnerTeam;
    if (didWin) {
      wins += 1;
      if (wasCaptain) captainWins += 1;
    } else {
      losses += 1;
      if (wasCaptain) captainLosses += 1;
    }

    const playerRealm = resolvePlayerRealm(draft, playerTeam);

    if (draft.type === "pvp") {
      if (didWin) pvpWins += 1;
      else pvpLosses += 1;
    } else if (playerRealm) {
      const entry = realmStats.get(playerRealm) ?? { wins: 0, losses: 0 };
      if (didWin) entry.wins += 1;
      else entry.losses += 1;
      realmStats.set(playerRealm, entry);
    }

    let team1CaptainName = "Unknown";
    let team2CaptainName = "Unknown";
    for (const p of draft.players) {
      if (p.isCaptain && p.team === 1) {
        const cId = toLeaderboardPlayerId(p.discordUserId, clerkByDiscordUserId);
        team1CaptainName = userNameByClerkUserId.get(cId) || p.displayName;
      }
      if (p.isCaptain && p.team === 2) {
        const cId = toLeaderboardPlayerId(p.discordUserId, clerkByDiscordUserId);
        team2CaptainName = userNameByClerkUserId.get(cId) || p.displayName;
      }
    }

    recentGames.push({
      shortId: draft.shortId,
      discordGuildId: draft.discordGuildId,
      createdAtMs: draft._creationTime ?? 0,
      didWin,
      wasCaptain,
      winnerTeam: draft.winnerTeam,
      playerTeam,
      team1CaptainName,
      team2CaptainName,
      draftType: draft.type,
      playerRealm,
    });

    opponentTeams.forEach((opponentTeam, opponentClerkUserId) => {
      if (opponentTeam === playerTeam) {
        return;
      }
      const entry = headToHeadStats.get(opponentClerkUserId) ?? { wins: 0, losses: 0 };
      if (didWin) {
        entry.wins += 1;
      } else {
        entry.losses += 1;
      }
      headToHeadStats.set(opponentClerkUserId, entry);
    });
  }

  const games = wins + losses;
  if (games === 0 || games < (filters.minGames ?? 0)) {
    return null;
  }

  const byRealm: Record<string, WinLossRecord> = {};
  realmStats.forEach((entry, realm) => {
    byRealm[realm] = computeWinRate(entry.wins, entry.losses);
  });

  const headToHead = Array.from(headToHeadStats.entries())
    .map(([opponentClerkUserId, value]) => {
      const opponentName =
        userNameByClerkUserId.get(opponentClerkUserId) ??
        headToHeadNameById.get(opponentClerkUserId) ??
        opponentClerkUserId;
      const opponentGames = value.wins + value.losses;
      return {
        playerClerkUserId,
        playerName,
        opponentClerkUserId,
        opponentName,
        opponentIsVerified: !opponentClerkUserId.startsWith("discord:"),
        wins: value.wins,
        losses: value.losses,
        games: opponentGames,
        winRate:
          opponentGames > 0
            ? Math.round((value.wins / opponentGames) * 1000) / 10
            : 0,
      };
    })
    .filter((row) => row.games >= (filters.minGames ?? 0))
    .sort((a, b) => {
      if (b.games !== a.games) return b.games - a.games;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });

  recentGames.sort((a, b) => b.createdAtMs - a.createdAtMs);

  return {
    playerClerkUserId,
    isVerified,
    playerName,
    profileName,
    avatarUrl,
    overall: computeWinRate(wins, losses),
    captain: computeWinRate(captainWins, captainLosses),
    byRealm,
    pvp: computeWinRate(pvpWins, pvpLosses),
    recentGames: recentGames.slice(0, recentLimit),
    headToHead,
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

export async function getPlayerDraftDrilldownStats(
  playerClerkUserId: string,
  filters: DraftStatsFilters
) {
  const context = await loadDraftIdentityContext();
  return aggregatePlayerDrilldown(
    context.drafts,
    context.clerkByDiscordUserId,
    context.userNameByClerkUserId,
    playerClerkUserId,
    filters
  );
}

export async function getDraftLogRows(): Promise<DraftLogRow[]> {
  const convex = getConvexClient();
  const completedDrafts = (await convex.query(
    "drafts:getCompletedDraftResults" as any,
    {}
  )) as Array<{
    shortId: string;
    type: "traditional" | "pvp";
    discordGuildId: string;
    discordGuildName?: string;
    createdBy: string;
    createdByDisplayName?: string;
    createdByAvatarUrl?: string;
    winnerTeam?: 1 | 2;
    resultStatus?: "unverified" | "verified" | "voided";
    _creationTime?: number;
    team1Realm?: string;
    team2Realm?: string;
    players: Array<{
      discordUserId: string;
      displayName: string;
      avatarUrl?: string;
      team?: 1 | 2;
      isCaptain: boolean;
    }>;
    bans?: Array<{
      team: 1 | 2;
      className: string;
    }>;
  }>;

  return completedDrafts
    .filter(
      (draft) =>
        draft.resultStatus === "verified" && draft.winnerTeam !== undefined
    )
    .map((draft) => {
      const creatorPlayer = draft.players.find(
        (player) => player.discordUserId === draft.createdBy
      );
      const createdByDisplayName =
        draft.createdByDisplayName || creatorPlayer?.displayName;
      const createdByAvatarUrl =
        draft.createdByAvatarUrl || creatorPlayer?.avatarUrl;

      return {
        shortId: draft.shortId,
        type: draft.type,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        createdBy: draft.createdBy,
        createdByDisplayName,
        createdByAvatarUrl,
        winnerTeam: draft.winnerTeam,
        resultStatus: "verified" as const,
        createdAtMs: draft._creationTime ?? 0,
        team1Realm: draft.team1Realm,
        team2Realm: draft.team2Realm,
        players: draft.players,
        bans: draft.bans ?? [],
      };
    });
}
