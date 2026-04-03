import { NextApiRequest, NextApiResponse } from "next";
import {
  type AdminAccountDeleteDeps,
  type AdminAccountSearchDeps,
  handleAdminAccountDelete,
  handleAdminAccountSearch,
} from "@/server/adminAccountsCore";

type SearchAccountsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
} & AdminAccountSearchDeps;

type DeleteAccountsDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
} & AdminAccountDeleteDeps;

export function createAdminAccountSearchHandler(deps: SearchAccountsDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const result = await handleAdminAccountSearch(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
        queryRaw: req.query.q,
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createAdminAccountDeleteHandler(deps: DeleteAccountsDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const body =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};
    const result = await handleAdminAccountDelete(
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
