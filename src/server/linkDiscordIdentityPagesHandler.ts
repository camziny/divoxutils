import { NextApiRequest, NextApiResponse } from "next";
import {
  type LinkDiscordIdentityApiDeps,
  handleLinkDiscordIdentityApi,
} from "@/server/linkDiscordIdentityApi";

type LinkDiscordIdentityHandlerDeps = LinkDiscordIdentityApiDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createLinkDiscordIdentityHandler =
  (deps: LinkDiscordIdentityHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const bodyDiscordUserId =
      typeof req.body?.discordUserId === "string" ? req.body.discordUserId : null;
    const result = await handleLinkDiscordIdentityApi(
      {
        method: req.method ?? "",
        clerkUserId: deps.getAuthUserId(req),
        bodyDiscordUserId,
      },
      deps
    );

    return res.status(result.status).json(result.body);
  };
