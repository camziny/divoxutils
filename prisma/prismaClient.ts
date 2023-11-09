import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

console.log("db url:", process.env.DATABASE_URL);

export default prisma;
