import { PrismaClient, Prisma } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_URL_NON_POOLING,
        },
      },
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
