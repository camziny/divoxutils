import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { isAdminClerkUserId } from "@/server/adminAuth";

type AdminDraftsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  listPendingDrafts: () => Promise<unknown>;
  listReviewedDrafts: () => Promise<unknown>;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function createAdminDraftsHandler(deps: AdminDraftsDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = deps.getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!deps.isAdminUserId(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const [pendingDrafts, reviewedDrafts] = await Promise.all([
        deps.listPendingDrafts(),
        deps.listReviewedDrafts(),
      ]);
      return res.status(200).json({ pendingDrafts, reviewedDrafts });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message ?? "Failed to fetch drafts." });
    }
  };
}

const handler = createAdminDraftsHandler({
  getAuthUserId: (req) => getAuth(req).userId ?? null,
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  listPendingDrafts: async () => {
    const convex = getConvexClient();
    return convex.query("drafts:getDraftsForModeration" as any, {});
  },
  listReviewedDrafts: async () => {
    const convex = getConvexClient();
    return convex.query("drafts:getReviewedDraftsForModeration" as any, {});
  },
});

export default handler;
