import { DAOC_GENDERED_CLASS_ALIASES } from "@/utils/classNameAliases";

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

export function toCanonicalDraftClassName(className: string): string {
  const trimmed = className.trim();
  if (!trimmed) return "";
  const alias = DAOC_GENDERED_CLASS_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

const REALM_TAGS: Record<(typeof REALMS)[number], "Alb" | "Mid" | "Hib"> = {
  Albion: "Alb",
  Midgard: "Mid",
  Hibernia: "Hib",
};

export function resolvePvpClassKey(
  isPvp: boolean,
  className: string,
  realm: (typeof REALMS)[number]
): string {
  if (!isPvp || className !== "Mauler") return className;
  return `Mauler (${REALM_TAGS[realm]})`;
}

const DRAFT_CLASS_REALM_TAG_PATTERN = /\s*\((Alb|Mid|Hib)\)$/;

export function stripDraftClassRealmTag(className: string): string {
  return className.replace(DRAFT_CLASS_REALM_TAG_PATTERN, "");
}

export function isValidDraftClassName(isPvp: boolean, className: string): boolean {
  const realmTagMatch = className.match(DRAFT_CLASS_REALM_TAG_PATTERN);
  const baseName = stripDraftClassRealmTag(className);
  if (!allClasses.includes(baseName)) return false;
  if (!isPvp) return !realmTagMatch;
  if (baseName === "Mauler") return !!realmTagMatch;
  return !realmTagMatch;
}

export function isKnownDraftClassName(className: string): boolean {
  return isValidDraftClassName(true, className) || isValidDraftClassName(false, className);
}

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
