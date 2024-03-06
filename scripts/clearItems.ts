import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearItems() {
  try {
    await prisma.bonus.deleteMany({});
    await prisma.weapon.deleteMany({});
    await prisma.shield.deleteMany({});
    await prisma.armor.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.jewelry.deleteMany({});
    await prisma.otherItem.deleteMany({});
    console.log("Items and related bonuses cleared successfully.");
  } catch (error) {
    console.error("Error clearing items and bonuses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearItems();
