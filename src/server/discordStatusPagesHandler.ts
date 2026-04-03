import { NextApiRequest, NextApiResponse } from "next";
import { type DiscordStatusApiDeps, handleDiscordStatusApi } from "@/server/discordStatusApi";

type DiscordStatusHandlerDeps = DiscordStatusApiDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createDiscordStatusHandler =
  (deps: DiscordStatusHandlerDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    const result = await handleDiscordStatusApi(
      {
        method: req.method ?? "",
        clerkUserId: deps.getAuthUserId(req),
      },
      deps
    );

    return res.status(result.status).json(result.body);
  };
