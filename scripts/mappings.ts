// mappings.ts

export const categoryMappings: { [key: number]: string } = {
  1: "Weapon",
  2: "Armor",
  3: "Shield",
  4: "Instrument",
  5: "Jewelry",
  6: "Mount",
  7: "Consumable",
  8: "Other",
};

export const slotMappings: { [key: number]: string } = {
  1: "Helm",
  2: "Hands",
  3: "Feet",
  4: "Jewel",
  5: "Torso",
  6: "Cloak",
  7: "Legs",
  8: "Arms",
  9: "Necklace",
  12: "Belt",
  13: "Bracer",
  15: "Ring",
  16: "Ring",
  17: "Mythirian",
};

export const bonusTypeMappings: { [key: number]: string } = {
  1: "Stats",
  2: "Skills",
  4: "Hit Points",
  5: "Resistance",
  6: "Focus",
  8: "Toa Melee Damage",
  9: "Toa Magic Damage",
  10: "Toa Style Damage",
  11: "Toa Archery Range",
  12: "Toa Spell Range",
  13: "Toa Spell Duration",
  14: "Toa Buff Bonus",
  15: "Toa Debuff Bonus",
  16: "Toa Heal Bonus",
  17: "Toa Fatigue",
  19: "Toa Melee Speed",
  20: "Toa Archery Speed",
  21: "Toa Cast Speed",
  22: "Armor Factor (AF)",
};

export const realmMappings: { [key: number]: string } = {
  1: "Albion",
  2: "Midgard",
  3: "Hibernia",
};

export const damageTypeMappings: { [key: number]: string } = {
  1: "Crush",
  2: "Slash",
  3: "Thrust",
  5: "Siege",
  17: "Spirit",
};

export function mapCategoryIdToName(categoryId: number): string {
  return categoryMappings[categoryId] || "Unknown Category";
}

export function mapSlotIdToName(slotId: number): string {
  return slotMappings[slotId] || "Unknown Slot";
}

export function mapBonusTypeIdToName(bonusTypeId: number): string {
  return bonusTypeMappings[bonusTypeId] || "Unknown Bonus Type";
}

export function mapRealmIdToName(realmId: number): string {
  return realmMappings[realmId] || "Unknown Realm";
}

export function mapDamageTypeIdToName(damageTypeId: number): string {
  return damageTypeMappings[damageTypeId] || "Unknown Damage Type";
}

export function mapAbsorptionIdToName(absorptionId: number): number {
  const absorptionMappings: Record<number, number> = {
    0: 0,
    10: 10,
    19: 19,
    27: 27,
    34: 34,
  };
  return absorptionMappings[absorptionId] || 0;
}
