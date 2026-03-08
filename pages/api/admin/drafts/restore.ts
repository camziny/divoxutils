import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { isAdminClerkUserId } from "@/server/adminAuth";

type RestoreDraftDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  restoreDraft: (args: {
    shortId: string;
    restoredByClerkUserId: string;
  }) => Promise<unknown>;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function createRestoreDraftHandler(deps: RestoreDraftDeps) {
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
    if (!shortId) {
      return res.status(400).json({ error: "shortId is required." });
    }

    try {
      const result = await deps.restoreDraft({
        shortId,
        restoredByClerkUserId: userId,
      });
      return res.status(200).json({ success: true, result });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message ?? "Failed to restore draft." });
    }
  };
}

const handler = createRestoreDraftHandler({
  getAuthUserId: (req) => getAuth(req).userId ?? null,
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  restoreDraft: async (args) => {
    const convex = getConvexClient();
    return convex.mutation("drafts:restoreCancelledDraftAsAdmin" as any, args);
  },
});

export default handler;
