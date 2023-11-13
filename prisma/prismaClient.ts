import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

console.log("Connecting to Database URL:", process.env.DATABASE_URL);

prisma.$use(async (params, next) => {
  console.log("Query:", params.model, params.action);
  console.log("Args:", params.args);

  try {
    const result = await next(params);
    console.log("Result:", result);
    return result;
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
});

export default prisma;
