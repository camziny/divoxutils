import { PrismaClient, Prisma } from "@prisma/client";

function createPrismaClient() {
  const url =
    process.env.NODE_ENV === "production"
      ? process.env.POSTGRES_PRISMA_URL
      : process.env.POSTGRES_URL_NON_POOLING;

  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });
}

function isStalePrismaClient(client: PrismaClient | undefined): boolean {
  if (!client) {
    return true;
  }

  const clientRecord = client as unknown as Record<string, unknown>;
  return Prisma.dmmf.datamodel.models.some((model) => {
    const delegateName =
      model.name.charAt(0).toLowerCase() + model.name.slice(1);
    return typeof clientRecord[delegateName] !== "object";
  });
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (isStalePrismaClient(global.prisma)) {
    global.prisma?.$disconnect().catch(() => {});
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma!;
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
