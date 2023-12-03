import { PrismaClient, Prisma } from "@prisma/client";

let prisma: PrismaClient;

const logLevels: Prisma.LogLevel[] = ["query", "info", "warn", "error"];

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?pgbouncer=true",
      },
    },
    log: logLevels,
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: logLevels,
    });
  }
  prisma = global.prisma;
}

prisma.$use(async (params, next) => {
  try {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    return result;
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
});

export default prisma;
