import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?connection_limit=10",
      },
    },
    // log: ["query", "info", "warn", "error"],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      // log: ["query", "info", "warn", "error"],
    });
  }
  prisma = global.prisma;
}

prisma.$use(async (params, next) => {
  try {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    // console.log(
    //   `Query ${params.model}.${params.action} took ${after - before}ms`
    // );
    return result;
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
});

export default prisma;
