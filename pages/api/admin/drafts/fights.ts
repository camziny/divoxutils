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
      classesByPlayer: Array<{
        playerId: string;
        className: string;
        substituteMode?: "known" | "manual";
        substituteDiscordUserId?: string;
        substituteDisplayName?: string;
        substituteAvatarUrl?: string;
      }>;
    }>;
    submittedBy: string;
  }) => Promise<unknown>;
};

function parseFightPayload(rawFights: unknown) {
  if (!Array.isArray(rawFights) || rawFights.length === 0) {
    return { error: "At least one fight is required." as const };
  }

  const fights: Array<{
    winnerTeam: 1 | 2;
    classesByPlayer: Array<{
      playerId: string;
      className: string;
      substituteMode?: "known" | "manual";
      substituteDiscordUserId?: string;
      substituteDisplayName?: string;
      substituteAvatarUrl?: string;
    }>;
  }> = [];

  for (const rawFight of rawFights) {
    if (!rawFight || typeof rawFight !== "object") {
      return { error: "Invalid fight payload." as const };
    }
    const winnerTeam = (rawFight as { winnerTeam?: unknown }).winnerTeam;
    if (winnerTeam !== 1 && winnerTeam !== 2) {
      return { error: "Each fight winner must be Team 1 or Team 2." as const };
    }
    const rawClasses = (rawFight as { classesByPlayer?: unknown }).classesByPlayer;
    if (!Array.isArray(rawClasses) || rawClasses.length === 0) {
      return { error: "Each fight must include at least one class entry." as const };
    }

    const classesByPlayer: Array<{
      playerId: string;
      className: string;
      substituteMode?: "known" | "manual";
      substituteDiscordUserId?: string;
      substituteDisplayName?: string;
      substituteAvatarUrl?: string;
    }> = [];

    for (const rawEntry of rawClasses) {
      if (!rawEntry || typeof rawEntry !== "object") {
        return { error: "Invalid class entry payload." as const };
      }
      const playerId =
        typeof (rawEntry as { playerId?: unknown }).playerId === "string"
          ? (rawEntry as { playerId: string }).playerId.trim()
          : "";
      const className =
        typeof (rawEntry as { className?: unknown }).className === "string"
          ? (rawEntry as { className: string }).className.trim()
          : "";
      if (!playerId || !className) {
        return { error: "Each class entry requires playerId and className." as const };
      }

      const substituteModeRaw = (rawEntry as { substituteMode?: unknown }).substituteMode;
      const substituteMode =
        substituteModeRaw === "known" || substituteModeRaw === "manual"
          ? substituteModeRaw
          : undefined;
      const substituteDiscordUserId =
        typeof (rawEntry as { substituteDiscordUserId?: unknown }).substituteDiscordUserId ===
        "string"
          ? (rawEntry as { substituteDiscordUserId: string }).substituteDiscordUserId.trim()
          : "";
      const substituteDisplayName =
        typeof (rawEntry as { substituteDisplayName?: unknown }).substituteDisplayName ===
        "string"
          ? (rawEntry as { substituteDisplayName: string }).substituteDisplayName.trim()
          : "";
      const substituteAvatarUrl =
        typeof (rawEntry as { substituteAvatarUrl?: unknown }).substituteAvatarUrl === "string"
          ? (rawEntry as { substituteAvatarUrl: string }).substituteAvatarUrl.trim()
          : "";

      if (substituteMode === "known") {
        if (!substituteDiscordUserId || !substituteDisplayName) {
          return {
            error:
              "Known substitute entries require substituteDiscordUserId and substituteDisplayName." as const,
          };
        }
      } else if (substituteMode === "manual") {
        if (!substituteDisplayName) {
          return {
            error: "Manual substitute entries require substituteDisplayName." as const,
          };
        }
        if (substituteDiscordUserId) {
          return {
            error: "Manual substitute entries cannot include substituteDiscordUserId." as const,
          };
        }
        if (substituteAvatarUrl) {
          return {
            error: "Manual substitute entries cannot include substituteAvatarUrl." as const,
          };
        }
      } else if (substituteDiscordUserId || substituteDisplayName || substituteAvatarUrl) {
        return {
          error: "substituteMode is required when substitute fields are provided." as const,
        };
      }

      const normalizedEntry: {
        playerId: string;
        className: string;
        substituteMode?: "known" | "manual";
        substituteDiscordUserId?: string;
        substituteDisplayName?: string;
        substituteAvatarUrl?: string;
      } = {
        playerId,
        className,
      };
      if (substituteMode === "known") {
        normalizedEntry.substituteMode = "known";
        normalizedEntry.substituteDiscordUserId = substituteDiscordUserId;
        normalizedEntry.substituteDisplayName = substituteDisplayName;
        if (substituteAvatarUrl) {
          normalizedEntry.substituteAvatarUrl = substituteAvatarUrl;
        }
      }
      if (substituteMode === "manual") {
        normalizedEntry.substituteMode = "manual";
        normalizedEntry.substituteDisplayName = substituteDisplayName;
      }
      classesByPlayer.push(normalizedEntry);
    }

    fights.push({ winnerTeam, classesByPlayer });
  }

  return { fights };
}

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
    const parsedFights = parseFightPayload(req.body?.fights);

    if (!shortId) {
      return res.status(400).json({ error: "shortId is required." });
    }
    if ("error" in parsedFights) {
      return res.status(400).json({ error: parsedFights.error });
    }

    try {
      await deps.replaceDraftFights({
        shortId,
        fights: parsedFights.fights,
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
