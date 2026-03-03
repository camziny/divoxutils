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
  opponentAvatarUrl?: string;
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
  byClass: Record<string, WinLossRecord>;
  classRanks: Record<
    string,
    {
      overallRank: number;
      overallTotal: number;
      verifiedRank?: number;
      verifiedTotal?: number;
    }
  >;
  pvp: WinLossRecord;
  recentGames: DraftRecentGameRow[];
  headToHead: DraftHeadToHeadRow[];
  headToHeadCaptain: DraftHeadToHeadRow[];
};

export type DraftLogRow = {
  shortId: string;
  type: "traditional" | "pvp";
  teamSize: number;
  discordGuildId: string;
  discordGuildName?: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  winnerTeam?: 1 | 2;
  team1FightWins?: number;
  team2FightWins?: number;
  setScore?: string;
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
  fights: Array<{
    fightNumber: number;
    winnerTeam: 1 | 2;
    classesByPlayer: Array<{
      playerId: string;
      discordUserId: string;
      className: string;
    }>;
  }>;
};

export type DraftClassLeaderboardRow = {
  className: string;
  clerkUserId: string;
  userName: string;
  avatarUrl?: string;
  isVerified: boolean;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
};

export type DraftClassLeaderPoint = {
  className: string;
  leaderClerkUserId: string;
  leaderName: string;
  isVerified: boolean;
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

export function aggregateClassRows(
  drafts: DraftLeaderboardDraft[],
  clerkByDiscordUserId: Map<string, string>,
  userNameByClerkUserId: Map<string, string>,
  className: string,
  filters: DraftStatsFilters
): DraftClassLeaderboardRow[] {
  const filteredDrafts = applyDraftStatsFilters(drafts, filters);
  const stats = new Map<
    string,
    {
      wins: number;
      losses: number;
      latestName: string;
      latestAvatarCreatedAt: number;
      avatarUrl?: string;
    }
  >();

  for (const draft of filteredDrafts) {
    for (const participant of draft.players) {
      if (participant.team === undefined) continue;
      const fightOutcomes = resolvePlayerClassFightOutcomes(
        draft,
        participant.team,
        participant.discordUserId,
        participant._id
      );
      const matchingOutcomes = fightOutcomes.filter(
        (outcome) => outcome.className === className
      );
      if (matchingOutcomes.length === 0) {
        continue;
      }
      const playerId = toLeaderboardPlayerId(participant.discordUserId, clerkByDiscordUserId);
      const entry = stats.get(playerId) ?? {
        wins: 0,
        losses: 0,
        latestName: participant.displayName?.trim() || playerId,
        latestAvatarCreatedAt: -1,
        avatarUrl: undefined,
      };
      for (const outcome of matchingOutcomes) {
        if (outcome.didWin) entry.wins += 1;
        else entry.losses += 1;
      }
      if (participant.displayName?.trim()) {
        entry.latestName = participant.displayName;
      }
      if (
        participant.avatarUrl &&
        typeof draft._creationTime === "number" &&
        draft._creationTime >= entry.latestAvatarCreatedAt
      ) {
        entry.latestAvatarCreatedAt = draft._creationTime;
        entry.avatarUrl = participant.avatarUrl;
      }
      stats.set(playerId, entry);
    }
  }

  return Array.from(stats.entries())
    .map(([playerId, value]) => {
      const games = value.wins + value.losses;
      return {
        className,
        clerkUserId: playerId,
        userName: userNameByClerkUserId.get(playerId) ?? value.latestName,
        avatarUrl: value.avatarUrl,
        isVerified: !playerId.startsWith("discord:"),
        wins: value.wins,
        losses: value.losses,
        games,
        winRate: games > 0 ? Math.round((value.wins / games) * 1000) / 10 : 0,
      };
    })
    .filter((row) => row.games >= (filters.minGames ?? 0))
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
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

function resolvePlayerClassFightOutcomes(
  draft: DraftLeaderboardDraft,
  playerTeam: 1 | 2,
  playerDiscordUserId: string,
  playerId?: string
): Array<{ className: string; didWin: boolean }> {
  const outcomes: Array<{ className: string; didWin: boolean }> = [];
  for (const fight of draft.fights ?? []) {
    const classEntry = fight.classesByPlayer.find((entry) => {
      if (playerId && entry.playerId === playerId) return true;
      return entry.discordUserId === playerDiscordUserId;
    });
    if (classEntry?.className) {
      outcomes.push({
        className: classEntry.className,
        didWin: playerTeam === fight.winnerTeam,
      });
    }
  }
  return outcomes;
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
  const classStats = new Map<string, { wins: number; losses: number }>();
  const recentGames: DraftRecentGameRow[] = [];
  const headToHeadStats = new Map<string, { wins: number; losses: number }>();
  const headToHeadCaptainStats = new Map<string, { wins: number; losses: number }>();
  const headToHeadNameById = new Map<string, string>();
  const headToHeadAvatarById = new Map<string, { avatarUrl: string; createdAt: number }>();
  let avatarUrl: string | undefined;
  let latestAvatarCreatedAt = -1;
  let latestDisplayNameCreatedAt = -1;

  for (const draft of filteredDrafts) {
    let playerTeam: 1 | 2 | undefined;
    let wasCaptain = false;
    let playerDiscordUserId: string | undefined;
    let playerDraftRowId: string | undefined;
    const opponentTeams = new Map<string, 1 | 2>();
    let opponentCaptainClerkUserId: string | undefined;
    let opponentCaptainTeam: 1 | 2 | undefined;

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
        playerDiscordUserId = participant.discordUserId;
        playerDraftRowId = participant._id;
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
        if (participant.isCaptain) {
          opponentCaptainClerkUserId = participantId;
          opponentCaptainTeam = participant.team;
        }
        if (participant.displayName.trim()) {
          headToHeadNameById.set(participantId, participant.displayName);
        }
        if (participant.avatarUrl && typeof draft._creationTime === "number") {
          const current = headToHeadAvatarById.get(participantId);
          if (!current || draft._creationTime >= current.createdAt) {
            headToHeadAvatarById.set(participantId, {
              avatarUrl: participant.avatarUrl,
              createdAt: draft._creationTime,
            });
          }
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

    if (playerDiscordUserId) {
      const classFightOutcomes = resolvePlayerClassFightOutcomes(
        draft,
        playerTeam,
        playerDiscordUserId,
        playerDraftRowId
      );
      for (const outcome of classFightOutcomes) {
        const classEntry = classStats.get(outcome.className) ?? { wins: 0, losses: 0 };
        if (outcome.didWin) classEntry.wins += 1;
        else classEntry.losses += 1;
        classStats.set(outcome.className, classEntry);
      }
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

    if (
      wasCaptain &&
      opponentCaptainClerkUserId &&
      opponentCaptainTeam !== undefined &&
      opponentCaptainTeam !== playerTeam
    ) {
      const entry = headToHeadCaptainStats.get(opponentCaptainClerkUserId) ?? {
        wins: 0,
        losses: 0,
      };
      if (didWin) {
        entry.wins += 1;
      } else {
        entry.losses += 1;
      }
      headToHeadCaptainStats.set(opponentCaptainClerkUserId, entry);
    }
  }

  const games = wins + losses;
  if (games === 0 || games < (filters.minGames ?? 0)) {
    return null;
  }

  const byRealm: Record<string, WinLossRecord> = {};
  realmStats.forEach((entry, realm) => {
    byRealm[realm] = computeWinRate(entry.wins, entry.losses);
  });
  const byClass: Record<string, WinLossRecord> = {};
  classStats.forEach((entry, className) => {
    byClass[className] = computeWinRate(entry.wins, entry.losses);
  });
  const classRanks: Record<
    string,
    {
      overallRank: number;
      overallTotal: number;
      verifiedRank?: number;
      verifiedTotal?: number;
    }
  > = {};

  if (classStats.size > 0) {
    const globalClassStats = new Map<
      string,
      Map<string, { wins: number; losses: number }>
    >();

    for (const draft of filteredDrafts) {
      for (const participant of draft.players) {
        if (participant.team === undefined) continue;
        const participantId = toLeaderboardPlayerId(
          participant.discordUserId,
          clerkByDiscordUserId
        );
        const classFightOutcomes = resolvePlayerClassFightOutcomes(
          draft,
          participant.team,
          participant.discordUserId,
          participant._id
        );
        for (const outcome of classFightOutcomes) {
          const className = outcome.className;
          const classMap =
            globalClassStats.get(className) ??
            new Map<string, { wins: number; losses: number }>();
          const entry = classMap.get(participantId) ?? { wins: 0, losses: 0 };
          if (outcome.didWin) entry.wins += 1;
          else entry.losses += 1;
          classMap.set(participantId, entry);
          globalClassStats.set(className, classMap);
        }
      }
    }

    for (const className of Array.from(classStats.keys())) {
      const classMap = globalClassStats.get(className);
      if (!classMap) continue;
      const rows = Array.from(classMap.entries())
        .map(([playerId, value]) => {
          const gamesForClass = value.wins + value.losses;
          return {
            playerId,
            wins: value.wins,
            losses: value.losses,
            games: gamesForClass,
            winRate:
              gamesForClass > 0
                ? Math.round((value.wins / gamesForClass) * 1000) / 10
                : 0,
          };
        })
        .filter((row) => row.games > 0)
        .sort((a, b) => {
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.games - a.games;
        });

      const rankIndex = rows.findIndex((row) => row.playerId === playerClerkUserId);
      if (rankIndex < 0) continue;

      const verifiedRows = rows.filter((row) => !row.playerId.startsWith("discord:"));
      const verifiedRankIndex = verifiedRows.findIndex(
        (row) => row.playerId === playerClerkUserId
      );

      classRanks[className] = {
        overallRank: rankIndex + 1,
        overallTotal: rows.length,
        verifiedRank: verifiedRankIndex >= 0 ? verifiedRankIndex + 1 : undefined,
        verifiedTotal: verifiedRows.length > 0 ? verifiedRows.length : undefined,
      };
    }
  }

  const toHeadToHeadRows = (statsMap: Map<string, { wins: number; losses: number }>) =>
    Array.from(statsMap.entries())
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
          opponentAvatarUrl: headToHeadAvatarById.get(opponentClerkUserId)?.avatarUrl,
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

  const headToHead = toHeadToHeadRows(headToHeadStats);
  const headToHeadCaptain = toHeadToHeadRows(headToHeadCaptainStats);

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
    byClass,
    classRanks,
    pvp: computeWinRate(pvpWins, pvpLosses),
    recentGames: recentGames.slice(0, recentLimit),
    headToHead,
    headToHeadCaptain,
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

export async function getClassDraftStats(
  className: string,
  filters: DraftStatsFilters
) {
  const context = await loadDraftIdentityContext();
  return aggregateClassRows(
    context.drafts,
    context.clerkByDiscordUserId,
    context.userNameByClerkUserId,
    className,
    filters
  );
}

export async function getClassLeaderOverview(
  filters: DraftStatsFilters,
  minGamesPerLeader = 1
): Promise<DraftClassLeaderPoint[]> {
  const context = await loadDraftIdentityContext();
  const filteredDrafts = applyDraftStatsFilters(context.drafts, filters);
  const classStatsByPlayer = new Map<
    string,
    Map<string, { wins: number; losses: number; latestName: string }>
  >();

  for (const draft of filteredDrafts) {
    for (const participant of draft.players) {
      if (participant.team === undefined) continue;
      const playerId = toLeaderboardPlayerId(
        participant.discordUserId,
        context.clerkByDiscordUserId
      );
      const classFightOutcomes = resolvePlayerClassFightOutcomes(
        draft,
        participant.team,
        participant.discordUserId,
        participant._id
      );
      for (const outcome of classFightOutcomes) {
        const className = outcome.className;
        const classMap =
          classStatsByPlayer.get(className) ??
          new Map<string, { wins: number; losses: number; latestName: string }>();
        const entry = classMap.get(playerId) ?? {
          wins: 0,
          losses: 0,
          latestName: participant.displayName?.trim() || playerId,
        };
        if (outcome.didWin) entry.wins += 1;
        else entry.losses += 1;
        if (participant.displayName?.trim()) {
          entry.latestName = participant.displayName;
        }
        classMap.set(playerId, entry);
        classStatsByPlayer.set(className, classMap);
      }
    }
  }

  return Array.from(classStatsByPlayer.entries())
    .map(([className, classMap]) => {
      const rows = Array.from(classMap.entries())
        .map(([playerId, value]) => {
          const games = value.wins + value.losses;
          return {
            playerId,
            wins: value.wins,
            losses: value.losses,
            games,
            winRate: games > 0 ? Math.round((value.wins / games) * 1000) / 10 : 0,
            latestName: value.latestName,
          };
        })
        .filter((row) => row.games >= minGamesPerLeader)
        .sort((a, b) => {
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.games - a.games;
        });

      const leader = rows[0];
      if (!leader) return null;
      return {
        className,
        leaderClerkUserId: leader.playerId,
        leaderName:
          context.userNameByClerkUserId.get(leader.playerId) ?? leader.latestName,
        isVerified: !leader.playerId.startsWith("discord:"),
        wins: leader.wins,
        losses: leader.losses,
        games: leader.games,
        winRate: leader.winRate,
      } satisfies DraftClassLeaderPoint;
    })
    .filter((row): row is DraftClassLeaderPoint => row !== null)
    .sort((a, b) => a.className.localeCompare(b.className));
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
    teamSize: number;
    discordGuildId: string;
    discordGuildName?: string;
    createdBy: string;
    createdByDisplayName?: string;
    createdByAvatarUrl?: string;
    winnerTeam?: 1 | 2;
    team1FightWins?: number;
    team2FightWins?: number;
    setScore?: string;
    resultStatus?: "unverified" | "verified" | "voided";
    _creationTime?: number;
    team1Realm?: string;
    team2Realm?: string;
    players: Array<{
      _id: string;
      discordUserId: string;
      displayName: string;
      avatarUrl?: string;
      team?: 1 | 2;
      isCaptain: boolean;
      selectedClass?: string;
    }>;
    fights?: Array<{
      fightNumber: number;
      winnerTeam: 1 | 2;
      classesByPlayer: Array<{
        playerId: string;
        discordUserId: string;
        className: string;
      }>;
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
        teamSize: draft.teamSize,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        createdBy: draft.createdBy,
        createdByDisplayName,
        createdByAvatarUrl,
        winnerTeam: draft.winnerTeam,
        team1FightWins: draft.team1FightWins ?? 0,
        team2FightWins: draft.team2FightWins ?? 0,
        setScore:
          draft.setScore ??
          `${draft.team1FightWins ?? 0}-${draft.team2FightWins ?? 0}`,
        resultStatus: "verified" as const,
        createdAtMs: draft._creationTime ?? 0,
        team1Realm: draft.team1Realm,
        team2Realm: draft.team2Realm,
        players: draft.players,
        bans: draft.bans ?? [],
        fights: draft.fights ?? [],
      };
    });
}
