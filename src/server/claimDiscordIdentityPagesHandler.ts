import { NextApiRequest, NextApiResponse } from "next";
import {
  type ClaimDiscordIdentityApiDeps,
  handleClaimDiscordIdentityApi,
} from "@/server/claimDiscordIdentityApi";

type ClaimDiscordIdentityHandlerDeps = ClaimDiscordIdentityApiDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createClaimDiscordIdentityHandler =
  (deps: ClaimDiscordIdentityHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const result = await handleClaimDiscordIdentityApi(
      {
        method: req.method ?? "",
        clerkUserId: deps.getAuthUserId(req),
        bodyDiscordUserId:
          typeof req.body?.discordUserId === "string" ? req.body.discordUserId : null,
        bodyDraftId: typeof req.body?.draftId === "string" ? req.body.draftId : null,
      },
      deps
    );

    return res.status(result.status).json(result.body);
  };
