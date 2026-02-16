export interface DraftPlayer {
  _id: string;
  _creationTime: number;
  draftId: string;
  discordUserId: string;
  displayName: string;
  avatarUrl?: string;
  team?: number;
  isCaptain: boolean;
  pickOrder?: number;
}

export interface DraftBan {
  _id: string;
  _creationTime: number;
  draftId: string;
  team: number;
  className: string;
}

export interface DraftData {
  _id: string;
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
  firstPickTeam?: number;
  firstRealmPickTeam?: number;
  pickSequence?: number[];
  currentPickIndex?: number;
  banSequence?: number[];
  currentBanIndex?: number;
  discordGuildId: string;
  discordChannelId: string;
  discordTextChannelId?: string;
  createdBy: string;
  winnerTeam?: number;
  gameStarted?: boolean;
  botPostedLink?: boolean;
  botNotifiedCaptains?: boolean;
  players: DraftPlayer[];
  bans: DraftBan[];
}

export interface CurrentPlayer {
  _id: string;
  _creationTime: number;
  draftId: string;
  discordUserId: string;
  displayName: string;
  team?: number;
  isCaptain: boolean;
  pickOrder?: number;
  token: string;
}
