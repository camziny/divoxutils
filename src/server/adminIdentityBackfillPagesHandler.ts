import { NextApiRequest, NextApiResponse } from "next";
import {
  type AdminIdentityBackfillDeps,
  handleAdminIdentityBackfill,
} from "@/server/adminIdentityBackfillCore";

type AdminIdentityBackfillPagesDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
} & AdminIdentityBackfillDeps;

export function createAdminIdentityBackfillHandler(deps: AdminIdentityBackfillPagesDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const body =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};
    const result = await handleAdminIdentityBackfill(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
        body,
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}
