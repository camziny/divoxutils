"use strict";
// mappings.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAbsorptionIdToName = exports.mapDamageTypeIdToName = exports.mapRealmIdToName = exports.mapBonusTypeIdToName = exports.mapSlotIdToName = exports.mapCategoryIdToName = exports.damageTypeMappings = exports.realmMappings = exports.bonusTypeMappings = exports.slotMappings = exports.categoryMappings = void 0;
exports.categoryMappings = {
    1: "Weapon",
    2: "Armor",
    3: "Shield",
    4: "Instrument",
    5: "Jewelry",
    6: "Mount",
    7: "Consumable",
    8: "Other",
};
exports.slotMappings = {
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
exports.bonusTypeMappings = {
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
exports.realmMappings = {
    1: "Albion",
    2: "Midgard",
    3: "Hibernia",
};
exports.damageTypeMappings = {
    1: "Crush",
    2: "Slash",
    3: "Thrust",
    5: "Siege",
    17: "Spirit",
};
function mapCategoryIdToName(categoryId) {
    return exports.categoryMappings[categoryId] || "Unknown Category";
}
exports.mapCategoryIdToName = mapCategoryIdToName;
function mapSlotIdToName(slotId) {
    return exports.slotMappings[slotId] || "Unknown Slot";
}
exports.mapSlotIdToName = mapSlotIdToName;
function mapBonusTypeIdToName(bonusTypeId) {
    return exports.bonusTypeMappings[bonusTypeId] || "Unknown Bonus Type";
}
exports.mapBonusTypeIdToName = mapBonusTypeIdToName;
function mapRealmIdToName(realmId) {
    return exports.realmMappings[realmId] || "Unknown Realm";
}
exports.mapRealmIdToName = mapRealmIdToName;
function mapDamageTypeIdToName(damageTypeId) {
    return exports.damageTypeMappings[damageTypeId] || "Unknown Damage Type";
}
exports.mapDamageTypeIdToName = mapDamageTypeIdToName;
function mapAbsorptionIdToName(absorptionId) {
    var absorptionMappings = {
        0: 0,
        10: 10,
        19: 19,
        27: 27,
        34: 34,
    };
    return absorptionMappings[absorptionId] || 0;
}
exports.mapAbsorptionIdToName = mapAbsorptionIdToName;
