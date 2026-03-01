import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { isAdminClerkUserId } from "@/server/adminAuth";

type ModerateAction =
  | "verify"
  | "void"
  | "override_team_1"
  | "override_team_2";
type ModerateDraftDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  isAdminUserId: (userId: string) => boolean;
  moderateDraftResult: (args: {
    shortId: string;
    action: ModerateAction;
    moderatedByClerkUserId: string;
    note?: string;
  }) => Promise<unknown>;
};

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url);
}

export function createModerateDraftHandler(deps: ModerateDraftDeps) {
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

    const shortId =
      typeof req.body?.shortId === "string" ? req.body.shortId.trim() : "";
    const action =
      typeof req.body?.action === "string" ? req.body.action.trim() : "";
    const note =
      typeof req.body?.note === "string" && req.body.note.trim()
        ? req.body.note.trim()
        : undefined;

    if (!shortId) {
      return res.status(400).json({ error: "shortId is required." });
    }
    if (
      !["verify", "void", "override_team_1", "override_team_2"].includes(action)
    ) {
      return res.status(400).json({
        error:
          "action must be verify, void, override_team_1, or override_team_2.",
      });
    }

    try {
      const result = await deps.moderateDraftResult({
        shortId,
        action: action as ModerateAction,
        moderatedByClerkUserId: userId,
        note,
      });
      return res.status(200).json({ success: true, result });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error?.message ?? "Failed to moderate draft." });
    }
  };
}

const handler = createModerateDraftHandler({
  getAuthUserId: (req) => getAuth(req).userId ?? null,
  isAdminUserId: (userId) => isAdminClerkUserId(userId),
  moderateDraftResult: async (args) => {
    const convex = getConvexClient();
    return convex.mutation("drafts:moderateDraftResult" as any, args);
  },
});

export default handler;
