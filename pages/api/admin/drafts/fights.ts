import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { isAdminClerkUserId } from "@/server/adminAuth";

type AdminDraftFightsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  replaceDraftFights: (args: {
    shortId: string;
    fights: Array<{
      winnerTeam: 1 | 2;
      classesByPlayer: Array<{ playerId: string; className: string }>;
    }>;
    submittedBy: string;
  }) => Promise<unknown>;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function createAdminDraftFightsHandler(deps: AdminDraftFightsDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = deps.getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!deps.isAdminUserId(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const shortId = typeof req.body?.shortId === "string" ? req.body.shortId.trim() : "";
    const fights = Array.isArray(req.body?.fights) ? req.body.fights : [];

    if (!shortId) {
      return res.status(400).json({ error: "shortId is required." });
    }
    if (!Array.isArray(fights) || fights.length === 0) {
      return res.status(400).json({ error: "At least one fight is required." });
    }

    try {
      await deps.replaceDraftFights({
        shortId,
        fights,
        submittedBy: userId,
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error?.message ?? "Failed to update draft fights." });
    }
  };
}

const handler = createAdminDraftFightsHandler({
  getAuthUserId: (req) => getAuth(req).userId ?? null,
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  replaceDraftFights: async (args) => {
    const convex = getConvexClient();
    return convex.mutation("drafts:adminReplaceDraftFights" as any, args);
  },
});

export default handler;
