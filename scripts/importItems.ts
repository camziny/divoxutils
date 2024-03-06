// import { PrismaClient, Prisma } from "@prisma/client";
// import * as fs from "fs";
// import * as path from "path";
// import { mapSlotIdToName, mapBonusTypeIdToName } from "./mappings";

// const prisma = new PrismaClient();

// interface BonusData {
//   type: number;
//   value: number;
// }

// interface TypeData {
//   two_handed?: number;
//   damage_type?: number;
//   shield_size?: number;
//   absorption?: number;
// }

// interface ItemData {
//   id: number;
//   name: string;
//   category: number;
//   realm: number;
//   slot: number;
//   absorption?: number;
//   type_data?: TypeData;
//   bonuses: BonusData[];
// }

// function calculateUtility(bonuses: BonusData[]): number {
//   if (!Array.isArray(bonuses)) {
//     return 0;
//   }
//   const utilityMultipliers: Record<number, number> = {
//     1: 0.6666667,
//     2: 5.0,
//     4: 0.25,
//     5: 2.0,
//     8: 5.0,
//     9: 5.0,
//     10: 5.0,
//     11: 5.0,
//     12: 5.0,
//     13: 2.0,
//     14: 2.0,
//     15: 2.0,
//     16: 2.0,
//     17: 2.0,
//     19: 5.0,
//     20: 5.0,
//     21: 5.0,
//     22: 1.0,
//     27: 5.0,
//     28: 2.0,
//     29: 0.25,
//     30: 2.0,
//     31: 2.0,
//     32: 5.0,
//     34: 2.0,
//     35: 5.0,
//     37: 2.0,
//     64: 2.0,
//     68: 4.0,
//     75: 4.0,
//   };

//   let totalUtility = 0;
//   for (const bonus of bonuses) {
//     const multiplier = utilityMultipliers[bonus.type] || 0;
//     totalUtility += bonus.value * multiplier;
//   }

//   return totalUtility;
// }

// async function importItems() {
//   const itemsFilePath = path.join(__dirname, "../data/static_objects.json");
//   const fileData = JSON.parse(fs.readFileSync(itemsFilePath, "utf-8"));
//   const itemsData: ItemData[] = fileData.items;

//   for (const itemData of itemsData) {
//     const itemSlot = itemData.slot
//       ? mapSlotIdToName(itemData.slot)
//       : "Unknown Slot";
//     const totalUtility = calculateUtility(itemData.bonuses);
//     const bonusesCreateInput = itemData.bonuses
//       ? itemData.bonuses.map((bonus) => ({
//           type: mapBonusTypeIdToName(bonus.type),
//           value: bonus.value,
//           isTOA: false,
//           utility: totalUtility,
//         }))
//       : [];

//     if (itemData.category === 1) {
//       await prisma.weapon.create({
//         data: {
//           name: itemData.name,
//           realm: itemData.realm,
//           twoHanded: itemData.type_data?.two_handed === 1,
//           damageType: itemData.type_data?.damage_type,
//           bonuses: { create: bonusesCreateInput },
//         },
//       });
//     } else if (itemData.category === 2) {
//       await prisma.armor.create({
//         data: {
//           name: itemData.name,
//           realm: itemData.realm,
//           slot: itemSlot,
//           absorption: itemData.type_data?.absorption,
//           bonuses: { create: bonusesCreateInput },
//         },
//       });
//     } else if (itemData.category === 3) {
//       await prisma.shield.create({
//         data: {
//           name: itemData.name,
//           realm: itemData.realm,
//           size: itemData.type_data?.shield_size || 0,
//           bonuses: { create: bonusesCreateInput },
//         },
//       });
//     } else if (itemData.category === 4) {
//       await prisma.instrument.create({
//         data: {
//           name: itemData.name,
//           realm: itemData.realm,
//           bonuses: { create: bonusesCreateInput },
//         },
//       });
//     } else if (itemData.category === 5) {
//       await prisma.jewelry.create({
//         data: {
//           name: itemData.name,
//           realm: itemData.realm,
//           bonuses: { create: bonusesCreateInput },
//         },
//       });
//     } else if (itemData.category === 8) {
//       await prisma.otherItem.create({
//         data: {
//           name: itemData.name,
//           realm: itemData.realm,
//           bonuses: { create: bonusesCreateInput },
//         },
//       });
//     }
//   }
// }

// importItems()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
