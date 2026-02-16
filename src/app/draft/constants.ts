export const REALMS = ["Albion", "Hibernia", "Midgard"] as const;

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

export const REALM_COLORS: Record<
  string,
  { bg: string; border: string; text: string; hover: string }
> = {
  Albion: {
    bg: "bg-red-800/20",
    border: "border-red-600",
    text: "text-red-400",
    hover: "hover:bg-red-700/30",
  },
  Hibernia: {
    bg: "bg-green-800/20",
    border: "border-green-600",
    text: "text-green-400",
    hover: "hover:bg-green-700/30",
  },
  Midgard: {
    bg: "bg-blue-800/20",
    border: "border-blue-600",
    text: "text-blue-400",
    hover: "hover:bg-blue-700/30",
  },
};

export type ClassCategory = "Support" | "Tank" | "Caster" | "Stealth" | "Mauler";

export const CLASS_CATEGORIES: Record<ClassCategory, string[]> = {
  Support: ["Bard", "Cleric", "Druid", "Friar", "Healer", "Shaman", "Warden"],
  Tank: [
    "Armsman",
    "Berserker",
    "Blademaster",
    "Champion",
    "Hero",
    "Mercenary",
    "Paladin",
    "Reaver",
    "Savage",
    "Skald",
    "Thane",
    "Valewalker",
    "Valkyrie",
    "Vampiir",
    "Warrior",
  ],
  Caster: [
    "Animist",
    "Bainshee",
    "Bonedancer",
    "Cabalist",
    "Eldritch",
    "Enchanter",
    "Heretic",
    "Mentalist",
    "Necromancer",
    "Runemaster",
    "Sorcerer",
    "Spiritmaster",
    "Theurgist",
    "Warlock",
    "Wizard",
  ],
  Stealth: [
    "Hunter",
    "Infiltrator",
    "Minstrel",
    "Nightshade",
    "Ranger",
    "Scout",
    "Shadowblade",
  ],
  Mauler: ["Mauler"],
};

export function getClassCategory(className: string): ClassCategory {
  for (const [cat, classes] of Object.entries(CLASS_CATEGORIES)) {
    if (classes.includes(className)) return cat as ClassCategory;
  }
  return "Tank";
}
