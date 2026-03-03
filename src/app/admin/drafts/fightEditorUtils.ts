import { allClasses } from "@/app/draft/constants";

export type FightEditorPlayer = {
  _id: string;
  displayName: string;
  team?: 1 | 2;
};

export type FightEditorFight = {
  fightNumber: number;
  winnerTeam: 1 | 2;
  classesByPlayer: Array<{
    playerId: string;
    discordUserId?: string;
    className: string;
  }>;
};

export type FightEditorDraft = {
  players: FightEditorPlayer[];
  fights: FightEditorFight[];
};

export type FightEditorRow = {
  winnerTeam: 1 | 2 | null;
  classesByPlayer: Record<string, string>;
};

export function createEmptyFightRow(
  draftedPlayers: FightEditorPlayer[]
): FightEditorRow {
  return {
    winnerTeam: null,
    classesByPlayer: Object.fromEntries(draftedPlayers.map((player) => [player._id, ""])),
  };
}

export function toFightEditorRows(draft: FightEditorDraft): FightEditorRow[] {
  const draftedPlayers = draft.players.filter((player) => player.team !== undefined);
  if (draft.fights.length === 0) {
    return [createEmptyFightRow(draftedPlayers)];
  }
  return draft.fights
    .slice()
    .sort((a, b) => a.fightNumber - b.fightNumber)
    .map((fight) => {
      const classesByPlayer: Record<string, string> = {};
      for (const player of draftedPlayers) {
        const existingClass = fight.classesByPlayer.find(
          (entry) => entry.playerId === player._id
        )?.className;
        classesByPlayer[player._id] = existingClass ?? "";
      }
      return { winnerTeam: fight.winnerTeam, classesByPlayer };
    });
}

export function analyzeFightEditor(
  rows: FightEditorRow[],
  draftedPlayers: FightEditorPlayer[]
): {
  team1Wins: number;
  team2Wins: number;
  completedFightCount: number;
  scoreReached: boolean;
  hasFightsAfterClinch: boolean;
  clinchFightNumber: number | null;
  firstIssue: { fightIndex: number; message: string } | null;
  isComplete: boolean;
  rowCompleteness: boolean[];
} {
  if (rows.length === 0) {
    return {
      team1Wins: 0,
      team2Wins: 0,
      completedFightCount: 0,
      scoreReached: false,
      hasFightsAfterClinch: false,
      clinchFightNumber: null,
      firstIssue: { fightIndex: 0, message: "Add at least one fight." },
      isComplete: false,
      rowCompleteness: [],
    };
  }

  let team1Wins = 0;
  let team2Wins = 0;
  let clinchFightNumber: number | null = null;
  let firstIssue: { fightIndex: number; message: string } | null = null;

  const rowCompleteness = rows.map((row, fightIndex) => {
    if (row.winnerTeam !== 1 && row.winnerTeam !== 2) {
      if (!firstIssue) {
        firstIssue = {
          fightIndex,
          message: `Fight ${fightIndex + 1}: set winner (Team 1 or Team 2).`,
        };
      }
      return false;
    }

    for (const player of draftedPlayers) {
      const className = row.classesByPlayer[player._id];
      if (!className || !allClasses.includes(className)) {
        if (!firstIssue) {
          firstIssue = {
            fightIndex,
            message: `Fight ${fightIndex + 1}: ${player.displayName} class not set.`,
          };
        }
        return false;
      }
    }

    if (row.winnerTeam === 1) team1Wins += 1;
    if (row.winnerTeam === 2) team2Wins += 1;
    if (!clinchFightNumber && (team1Wins >= 3 || team2Wins >= 3)) {
      clinchFightNumber = fightIndex + 1;
    }
    return true;
  });

  const completedFightCount = rowCompleteness.filter(Boolean).length;
  const scoreReached = team1Wins >= 3 || team2Wins >= 3;
  const hasFightsAfterClinch =
    clinchFightNumber !== null && rows.length > clinchFightNumber;

  if (!firstIssue && hasFightsAfterClinch && clinchFightNumber !== null) {
    firstIssue = {
      fightIndex: clinchFightNumber,
      message: `Set is already complete at Fight ${clinchFightNumber}. Remove extra fights.`,
    };
  }

  if (!firstIssue && !scoreReached) {
    firstIssue = {
      fightIndex: rows.length - 1,
      message: "Set score must reach first-to-3 wins.",
    };
  }

  const isComplete =
    rows.length > 0 &&
    completedFightCount === rows.length &&
    scoreReached &&
    !hasFightsAfterClinch;

  return {
    team1Wins,
    team2Wins,
    completedFightCount,
    scoreReached,
    hasFightsAfterClinch,
    clinchFightNumber,
    firstIssue,
    isComplete,
    rowCompleteness,
  };
}
