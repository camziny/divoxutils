import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getAdminClerkUserIds } from "@/server/adminAuth";

type DeleteAccountsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
  isAdminUserId: (userId: string) => boolean;
  findLocalUser: (clerkUserId: string) => Promise<{ id: number; name: string | null } | null>;
  deleteLocalUserData: (args: { clerkUserId: string; userId: number }) => Promise<void>;
  deleteClerkUser: (clerkUserId: string) => Promise<void>;
};

export function createAdminAccountDeleteHandler(deps: DeleteAccountsDeps) {
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

    const clerkUserId =
      typeof req.body?.clerkUserId === "string" ? req.body.clerkUserId.trim() : "";

    if (!clerkUserId) {
      return res.status(400).json({ error: "clerkUserId is required." });
    }

    const user = await deps.findLocalUser(clerkUserId);
    const localUserFound = Boolean(user);
    if (localUserFound && user) {
      try {
        await deps.deleteLocalUserData({ clerkUserId, userId: user.id });
      } catch (error: any) {
        return res.status(500).json({
          error: error?.message ?? "Failed to delete local user data.",
        });
      }
    }

    try {
      await deps.deleteClerkUser(clerkUserId);
    } catch (error: any) {
      const isNotFound =
        error?.status === 404 || error?.errors?.[0]?.code === "resource_not_found";
      if (!isNotFound) {
        return res.status(502).json({
          error:
            "Local cleanup completed, but failed to remove the Clerk account. Please retry Clerk deletion.",
          localUserFound,
        });
      }
      if (!localUserFound) {
        return res.status(200).json({
          success: true,
          note: "Local user was already removed and Clerk account was already deleted.",
        });
      }
    }

    if (!localUserFound) {
      return res.status(200).json({
        success: true,
        note: "Local user was already removed. Clerk account deleted successfully.",
      });
    }

    return res.status(200).json({ success: true });
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = require("../../../../prisma/prismaClient").default;
  const { clerkClient } = require("@clerk/nextjs");
  return createAdminAccountDeleteHandler({
    getAuthUserId: (request) => getAuth(request).userId,
    isAdminUserId: (userId) => getAdminClerkUserIds().includes(userId),
    findLocalUser: (clerkUserId) =>
      prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true, name: true },
      }),
    deleteLocalUserData: ({ clerkUserId, userId }) =>
      prisma
        .$transaction([
          prisma.groupUser.deleteMany({ where: { clerkUserId } }),
          prisma.userCharacter.deleteMany({ where: { clerkUserId } }),
          prisma.account.deleteMany({ where: { userId } }),
          prisma.user.deleteMany({ where: { clerkUserId } }),
        ])
        .then(() => undefined),
    deleteClerkUser: (clerkUserId) => clerkClient.users.deleteUser(clerkUserId),
  })(req, res);
}
