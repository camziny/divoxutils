import { Id } from "../../../../convex/_generated/dataModel";

export interface DraftPlayer {
  _id: Id<"draftPlayers">;
  _creationTime: number;
  draftId: Id<"drafts">;
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: 1 | 2;
  isCaptain: boolean;
  pickOrder?: number;
  selectedClass?: string;
}

export interface DraftBan {
  _id: string;
  _creationTime: number;
  draftId: Id<"drafts">;
  team: 1 | 2;
  className: string;
  source?: "captain" | "auto";
  phase?: "initial" | "deferred";
}

export interface DraftData {
  _id: Id<"drafts">;
  _creationTime: number;
  shortId: string;
  type: "traditional" | "pvp";
  status:
    | "setup"
    | "coin_flip"
    | "realm_pick"
    | "banning"
    | "drafting"
    | "complete"
    | "cancelled";
  teamSize: number;
  coinFlipWinnerId?: string;
  coinFlipChoice?: string;
  team1Realm?: string;
  team2Realm?: string;
  team1CaptainId?: string;
  team2CaptainId?: string;
  firstPickTeam?: 1 | 2;
  firstRealmPickTeam?: 1 | 2;
  pickOrderMode?: "snake" | "alternating";
  bansPerCaptain?: number;
  banTimingMode?: "before_picks" | "after_2_picks" | "after_3_picks" | "after_4_picks";
  safeClassNames?: string[];
  pickSequence?: (1 | 2)[];
  currentPickIndex?: number;
  banSequence?: (1 | 2)[];
  initialBanSequence?: (1 | 2)[];
  currentBanIndex?: number;
  activeBanPhase?: "initial" | "deferred";
  deferredBanSequence?: (1 | 2)[];
  deferredBanTriggerPickCount?: number;
  deferredBanTriggered?: boolean;
  discordGuildId: string;
  discordGuildName?: string;
  discordChannelId: string;
  discordTextChannelId?: string;
  createdBy: string;
  createdByDisplayName?: string;
  createdByAvatarUrl?: string;
  winnerTeam?: 1 | 2;
  pendingWinnerTeam?: 1 | 2;
  setFinalizedAt?: number;
  setFinalizedBy?: string;
  gameStarted?: boolean;
  team1FightWins?: number;
  team2FightWins?: number;
  setScore?: string;
  botPostedLink?: boolean;
  botNotifiedCaptains?: boolean;
  cancelledBy?: string;
  cancelledAt?: number;
  cancelReason?: string;
  cancelledFromStatus?:
    | "setup"
    | "coin_flip"
    | "realm_pick"
    | "banning"
    | "drafting"
    | "complete";
  players: DraftPlayer[];
  bans: DraftBan[];
  fights: Array<{
    _id: string;
    _creationTime: number;
    draftId: Id<"drafts">;
    fightNumber: number;
    winnerTeam: 1 | 2;
    classesByPlayer: Array<{
      playerId: Id<"draftPlayers">;
      discordUserId: string;
      className: string;
    }>;
    submittedBy: string;
  }>;
}

export interface CurrentPlayer {
  _id: Id<"draftPlayers">;
  _creationTime: number;
  draftId: Id<"drafts">;
  discordUserId: string;
  displayName: string;
  team?: 1 | 2;
  isCaptain: boolean;
  pickOrder?: number;
  token: string;
}
