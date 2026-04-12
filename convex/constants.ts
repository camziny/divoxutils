export const REALMS = ["Albion", "Hibernia", "Midgard"] as const;
export type Realm = (typeof REALMS)[number];

export const classesByRealm: Record<string, string[]> = {
  Albion: [
    "Armsman",
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
    "Hero",
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
};

export const allClasses: string[] = Array.from(
  new Set(Object.values(classesByRealm).flat())
).sort();

const DRAFT_CLASS_ALIASES: Record<string, string> = {
  armswoman: "Armsman",
  enchantress: "Enchanter",
  heroine: "Hero",
  huntress: "Hunter",
  sorceress: "Sorcerer",
};

export function toCanonicalDraftClassName(className: string): string {
  const trimmed = className.trim();
  if (!trimmed) return "";
  const alias = DRAFT_CLASS_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}
