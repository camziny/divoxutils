import { NextApiRequest, NextApiResponse } from "next";
import { type LayoutPreferenceApiDeps, type LayoutPreferenceResponseBody, handleLayoutPreferenceApi } from "@/server/layoutPreferenceApi";

type LayoutPreferenceHandlerDeps = LayoutPreferenceApiDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createLayoutPreferenceHandler =
  (deps: LayoutPreferenceHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse<LayoutPreferenceResponseBody>) => {
    const result = await handleLayoutPreferenceApi(
      {
        method: req.method ?? "",
        clerkUserId: deps.getAuthUserId(req),
        body: req.body,
      },
      deps
    );

    if (result.allow) {
      res.setHeader("Allow", result.allow);
    }

    return res.status(result.status).json(result.body);
  };
