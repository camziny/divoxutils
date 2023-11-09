import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

prisma.$use(async (params, next) => {
  console.log("Query:", params.model, params.action);
  console.log("Args:", params.args);
  return next(params);
});

console.log("DB url:", process.env.DATABASE_URL);

export default prisma;
