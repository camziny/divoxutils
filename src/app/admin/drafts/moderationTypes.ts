import type { FightEditorRow } from "./fightEditorUtils";

export type ModerationPlayer = {
  _id: string;
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: 1 | 2;
  isCaptain: boolean;
  selectedClass?: string;
};

export type ModerationFight = {
  fightNumber: number;
  winnerTeam: 1 | 2;
  classesByPlayer: Array<{
    playerId: string;
    discordUserId: string;
    className: string;
    substituteMode?: "known" | "manual";
    substituteDiscordUserId?: string;
    substituteDisplayName?: string;
    substituteAvatarUrl?: string;
  }>;
};

export type ModerationDraft = {
  _id: string;
  shortId: string;
  discordGuildId: string;
  discordGuildName?: string;
  winnerTeam?: 1 | 2;
  team1FightWins: number;
  team2FightWins: number;
  setScore: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  resultStatus: "unverified" | "verified" | "voided";
  resultModeratedAt?: number;
  resultModeratedBy?: string;
  _creationTime: number;
  players: ModerationPlayer[];
  fights: ModerationFight[];
};

export type CancelableDraft = {
  _id: string;
  shortId: string;
  status: "setup" | "coin_flip" | "realm_pick" | "banning" | "drafting" | "complete";
  gameStarted?: boolean;
  discordGuildId: string;
  discordGuildName?: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  teamSize: number;
  playerCount: number;
  assignedCount: number;
  captainCount: number;
  selectedClassCount: number;
  fightCount: number;
  minimumPlayers: number;
  hasEnoughPlayers: boolean;
  ageMinutes: number;
  isLikelyStale: boolean;
  cancelConfidence: "safe" | "probably_abandoned" | "needs_review";
  cancelReasons: string[];
  _creationTime: number;
};

export type CancelledDraftEntry = {
  _id: string;
  shortId: string;
  cancelledAt: number;
  cancelledBy?: string;
  cancelReason?: string;
  discordGuildId: string;
  discordGuildName?: string;
  createdBy: string;
  createdByDisplayName?: string;
  playerCount: number;
  assignedCount: number;
  selectedClassCount: number;
  fightCount: number;
  _creationTime: number;
};

export type Action = "verify" | "void" | "override_team_1" | "override_team_2";
export type SortOrder = "newest" | "oldest";
export type CancelableFilter = "safe" | "probably_abandoned" | "all";
export type ReviewedFilter = "all" | "verified" | "voided";

export type ConfirmAction = {
  kind: "cancel" | "restore";
  shortId: string;
  title: string;
  description: string;
  confirmLabel: string;
};

export type FightEditorByDraft = Record<string, FightEditorRow[]>;
