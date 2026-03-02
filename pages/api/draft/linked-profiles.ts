import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/prismaClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const discordUserIds = Array.isArray(req.body?.discordUserIds)
    ? req.body.discordUserIds.filter((value: unknown): value is string => {
        return typeof value === "string" && value.trim().length > 0;
      })
    : [];

  if (discordUserIds.length === 0) {
    return res.status(200).json({ links: {} });
  }

  const uniqueIds = Array.from(new Set(discordUserIds));

  try {
    const links = await prisma.userIdentityLink.findMany({
      where: {
        provider: "discord",
        status: "linked",
        providerUserId: {
          in: uniqueIds,
        },
        user: {
          name: {
            not: null,
          },
        },
      },
      select: {
        providerUserId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const byDiscordUserId: Record<string, { profileName: string; characterListUrl: string }> =
      {};

    for (const link of links) {
      const profileName = link.user.name?.trim();
      if (!profileName) continue;
      byDiscordUserId[link.providerUserId] = {
        profileName,
        characterListUrl: `/user/${encodeURIComponent(profileName)}/characters`,
      };
    }

    return res.status(200).json({ links: byDiscordUserId });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message ?? "Failed to load linked profiles." });
  }
}
