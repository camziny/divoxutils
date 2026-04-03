import { NextApiRequest, NextApiResponse } from "next";
import { type ModerateClaimApiDeps, handleModerateClaimApi } from "@/server/moderateClaimApi";

type ModerateClaimHandlerDeps = ModerateClaimApiDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createModerateClaimHandler =
  (deps: ModerateClaimHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const claimId =
      typeof req.body?.claimId === "number" ? req.body.claimId : Number(req.body?.claimId);
    const result = await handleModerateClaimApi(
      {
        method: req.method ?? "",
        clerkUserId: deps.getAuthUserId(req),
        claimId: Number.isFinite(claimId) ? claimId : null,
        action: typeof req.body?.action === "string" ? req.body.action : null,
      },
      deps
    );

    return res.status(result.status).json(result.body);
  };
