import prisma from "../../../../prisma/prismaClient";
import { createUpdateClassChampionsRouteHandlers } from "@/server/api/classChampionRouteHandlers";
import { syncClassChampionsFromSources } from "@/server/classChampionStore";

const handlers = createUpdateClassChampionsRouteHandlers({
  cronSecret: process.env.CRON_SECRET,
  syncClassChampions: () => syncClassChampionsFromSources(prisma, fetch),
});

export const POST = handlers.POST;
export const GET = handlers.GET;
