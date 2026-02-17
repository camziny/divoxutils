import { Id } from "../../../convex/_generated/dataModel";

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
}

export interface DraftBan {
  _id: string;
  _creationTime: number;
  draftId: Id<"drafts">;
  team: 1 | 2;
  className: string;
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
    | "complete";
  teamSize: number;
  coinFlipWinnerId?: string;
  coinFlipChoice?: string;
  team1Realm?: string;
  team2Realm?: string;
  team1CaptainId?: string;
  team2CaptainId?: string;
  firstPickTeam?: 1 | 2;
  firstRealmPickTeam?: 1 | 2;
  pickSequence?: (1 | 2)[];
  currentPickIndex?: number;
  banSequence?: (1 | 2)[];
  currentBanIndex?: number;
  discordGuildId: string;
  discordChannelId: string;
  discordTextChannelId?: string;
  createdBy: string;
  winnerTeam?: 1 | 2;
  gameStarted?: boolean;
  botPostedLink?: boolean;
  botNotifiedCaptains?: boolean;
  players: DraftPlayer[];
  bans: DraftBan[];
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
