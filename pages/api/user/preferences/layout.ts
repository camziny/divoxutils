import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "../../../../prisma/prismaClient";
import {
  isCharacterListLayout,
  type CharacterListLayout,
} from "@/server/characterListLayoutPreference";

type ResponseBody = { layout?: CharacterListLayout; error?: string };

type LayoutPreferenceHandlerDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  findUserLayout: (
    clerkUserId: string
  ) => Promise<{ preferredCharacterListLayout: string } | null>;
  findUserByClerkId: (
    clerkUserId: string
  ) => Promise<{ clerkUserId: string } | null>;
  updateUserLayout: (
    clerkUserId: string,
    layout: CharacterListLayout
  ) => Promise<{ preferredCharacterListLayout: string }>;
};

export const createLayoutPreferenceHandler =
  (deps: LayoutPreferenceHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse<ResponseBody>) => {
    const clerkUserId = deps.getAuthUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const user = await deps.findUserLayout(clerkUserId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const layout = isCharacterListLayout(user.preferredCharacterListLayout)
        ? user.preferredCharacterListLayout
        : "table";

      return res.status(200).json({ layout });
    }

    if (req.method === "PUT") {
      const layout = req.body?.layout;
      if (!isCharacterListLayout(layout)) {
        return res.status(400).json({ error: "Invalid layout" });
      }

      const existingUser = await deps.findUserByClerkId(clerkUserId);

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = await deps.updateUserLayout(clerkUserId, layout);

      const responseLayout = isCharacterListLayout(
        user.preferredCharacterListLayout
      )
        ? user.preferredCharacterListLayout
        : "table";

      return res.status(200).json({ layout: responseLayout });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  };

const handler = createLayoutPreferenceHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  findUserLayout: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { preferredCharacterListLayout: true },
    }),
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true },
    }),
  updateUserLayout: (clerkUserId, layout) =>
    prisma.user.update({
      where: { clerkUserId },
      data: { preferredCharacterListLayout: layout },
      select: { preferredCharacterListLayout: true },
    }),
});

export default handler;
