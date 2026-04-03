import { NextApiRequest, NextApiResponse } from "next";
import { type PendingClaimsApiDeps, handlePendingClaimsApi } from "@/server/pendingClaimsApi";

type PendingClaimsHandlerDeps = PendingClaimsApiDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createPendingClaimsHandler =
  (deps: PendingClaimsHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const result = await handlePendingClaimsApi(
      {
        method: req.method ?? "",
        clerkUserId: deps.getAuthUserId(req),
      },
      deps
    );

    return res.status(result.status).json(result.body);
  };
