export type Group = {
  name: string;
  id: number;
  groupOwner: string;
};

export type Character = {
  characterName: string;
  className: string;
  deathsLastWeek: number;
  id: number;
  lastUpdated: string;
  nameLastUpdated: string;
  previousCharacterName: string;
  realmPointsLastWeek: number;
  soloKillsLastWeek: number;
  totalDeaths: number;
  totalRealmPoints: number;
  totalSoloKills: number;
  webId: string;
};

export type UserWithCharacters = {
  id: number | string;
  clerkUserId: string;
  name: string;
  characters: Character[];
  selectedRealm?: string;
};

export type GroupUserSearchProps = {
  clerkUserId?: string;
  group?: Group;
  onUserAdd: (user: UserWithCharacters) => void;
};

export type User = {
  id: number;
  clerkUserId: string;
  name: string;
  selected: boolean;
};

export type GroupBuilderFormProps = {
  clerkUserId: string;
  group: Group | null;
  groupUsers: UserWithCharacters[];
  active: UserWithCharacters[];
  roster: UserWithCharacters[];
};

export type GroupRosterProps = {
  users: UserWithCharacters[];
  onUserInteract: (
    userId: string,
    groupId: string,
    user: UserWithCharacters
  ) => void;
  groupId: number;
};

export type ActiveGroupProps = {
  users: UserWithCharacters[];
  selectedRealm: string;
  selectedCharacters: { [key: string]: number | null };
  onCharacterSelect: (userId: string, characterId: number) => void;
};

export type Realm = "Albion" | "Hibernia" | "Midgard" | "PvP";

export type CharacterWrapper = {
  character: any;
  characterId: number;
  clerkUserId: string;
  user: {
    id: number;
    clerkUserId: string;
    email: string;
    name: string;
    accountId: null | string;
  };
};

export type GroupCharacterSelectorProps = {
  clerkUserId: string;
  characters: any[];
  selectedCharacterId: number | null;
  onCharacterSelect: (characterId: number) => void;
  selectedRealm: Realm;
};

export type CharacterClassesByRealm = {
  [key in Realm]: string[];
};

export const characterClassesByRealm: CharacterClassesByRealm = {
  Albion: [
    "Armsman",
    "Armswoman",
    "Cabalist",
    "Cleric",
    "Friar",
    "Heretic",
    "Infiltrator",
    "Mauler",
    "Mercenary",
    "Minstrel",
    "Necromancer",
    "Paladin",
    "Reaver",
    "Scout",
    "Sorcerer",
    "Sorceress",
    "Theurgist",
    "Wizard",
  ],
  Hibernia: [
    "Animist",
    "Bainshee",
    "Bard",
    "Blademaster",
    "Champion",
    "Druid",
    "Eldritch",
    "Enchanter",
    "Enchantress",
    "Hero",
    "Heroine",
    "Mauler",
    "Mentalist",
    "Nightshade",
    "Ranger",
    "Valewalker",
    "Vampiir",
    "Warden",
  ],
  Midgard: [
    "Berserker",
    "Bonedancer",
    "Healer",
    "Hunter",
    "Mauler",
    "Runemaster",
    "Savage",
    "Shadowblade",
    "Shaman",
    "Skald",
    "Spiritmaster",
    "Thane",
    "Valkyrie",
    "Warlock",
    "Warrior",
  ],
  PvP: [],
};

characterClassesByRealm.PvP = Array.from(
  new Set([
    ...characterClassesByRealm.Albion,
    ...characterClassesByRealm.Hibernia,
    ...characterClassesByRealm.Midgard,
  ])
);

export interface GroupUser {
  id: number;
  clerkUserId: string;
  email: string;
  name: string;
  accountId: null | string;
  isInActiveGroup: boolean;
  characters?: Character[];
}

export interface GroupRealmSelectorProps {
  selectedRealm: string;
  setSelectedRealm: (realm: string) => void;
}

export type UserCharacterData = {
  id: number;
  webId?: string;
  characterName: string;
  className: string;
  previousCharacterName?: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  totalDeaths: number;
  deathsLastWeek: number;
  lastUpdated: string;
  nameLastUpdated: string;
};

export type GroupUserData = {
  id: number;
  clerkUserId: string;
  email: string;
  name: string;
  accountId: null | string;
};

export type GroupOwnerData = {
  user: GroupUserData;
  character: UserCharacterData;
  isInActiveGroup: boolean;
};

export type GroupMemberData = {
  groupId: number;
  clerkUserId: string;
  characterId: number | null;
  isInActiveGroup: boolean;
  user: GroupUserData;
  character?: UserCharacterData | null;
};

export interface ViewGroupProps {
  groupOwnerData: GroupOwnerData;
  usersData: GroupMemberData[];
  isGroupPrivate: boolean;
  activeGroupUserIds: string[];
}
