import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ["query", "info", "warn", "error"],
});

prisma.$use(async (params, next) => {
  try {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    console.log(
      `Query ${params.model}.${params.action} took ${after - before}ms`
    );
    return result;
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
});

export default prisma;
