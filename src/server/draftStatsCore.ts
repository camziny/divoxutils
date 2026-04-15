import { DraftLeaderboardDraft } from "./draftLeaderboard";

export type WinLossRecord = {
  wins: number;
  losses: number;
  games: number;
  winRate: number;
};

export function computeWinRate(
  wins: number,
  losses: number,
  minGamesFloor = 0
): WinLossRecord {
  const games = wins + losses;
  const denominator = Math.max(games, minGamesFloor);
  return {
    wins,
    losses,
    games,
    winRate: denominator > 0 ? Math.round((wins / denominator) * 1000) / 10 : 0,
  };
}

export function resolvePlayerRealm(
  draft: DraftLeaderboardDraft,
  playerTeam: 1 | 2
): string | undefined {
  if (draft.type !== "traditional") return undefined;
  return playerTeam === 1 ? draft.team1Realm : draft.team2Realm;
}

export function resolvePlayerClassFightOutcomes(
  draft: DraftLeaderboardDraft,
  playerTeam: 1 | 2,
  playerDiscordUserId: string,
  playerId?: string
): Array<{ className: string; didWin: boolean }> {
  const outcomes: Array<{ className: string; didWin: boolean }> = [];
  for (const fight of draft.fights ?? []) {
    const classEntry = fight.classesByPlayer.find((entry) => {
      if (playerId && entry.playerId === playerId) {
        if (entry.substituteMode === "manual") {
          return false;
        }
        if (entry.substituteMode === "known" && entry.substituteDiscordUserId) {
          return entry.substituteDiscordUserId === playerDiscordUserId;
        }
        return entry.discordUserId === playerDiscordUserId;
      }
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
