import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import prisma from "../../../prisma/prismaClient";

type RequestBody = {
  username?: string;
};

type HandlerDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
  updateClerkUsername: (
    userId: string,
    username: string
  ) => Promise<void>;
  updateLocalUsername: (
    clerkUserId: string,
    username: string
  ) => Promise<{ clerkUserId: string; name: string | null }>;
};

export const createUpdateUsernameHandler =
  (deps: HandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "PATCH") {
      res.setHeader("Allow", ["PATCH"]);
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const userId = deps.getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username } = (req.body || {}) as RequestBody;
    const trimmedUsername = username?.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long." });
    }

    try {
      await deps.updateClerkUsername(userId, trimmedUsername);
      const updatedUser = await deps.updateLocalUsername(
        userId,
        trimmedUsername
      );

      return res.status(200).json({
        success: true,
        user: {
          clerkUserId: updatedUser.clerkUserId,
          name: updatedUser.name,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error?.message || "Failed to update username",
      });
    }
  };

const handler = createUpdateUsernameHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  updateClerkUsername: async (userId, username) => {
    await clerkClient.users.updateUser(userId, { username });
  },
  updateLocalUsername: async (clerkUserId, username) => {
    return prisma.user.update({
      where: { clerkUserId },
      data: { name: username },
      select: {
        clerkUserId: true,
        name: true,
      },
    });
  },
});

export default handler;
