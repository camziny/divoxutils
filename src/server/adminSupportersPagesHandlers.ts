import { NextApiRequest, NextApiResponse } from "next";
import {
  type AdminSupportersListDeps,
  type AdminSupportersSearchDeps,
  type AdminSupportersUpdateDeps,
  handleAdminSupportersList,
  handleAdminSupportersSearch,
  handleAdminSupportersUpdate,
} from "@/server/adminSupportersCore";

type SupportersListDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
} & AdminSupportersListDeps;

type SupportersSearchDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
} & AdminSupportersSearchDeps;

type SupportersUpdateDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null | undefined;
} & AdminSupportersUpdateDeps;

export function createAdminSupportersListHandler(deps: SupportersListDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const result = await handleAdminSupportersList(
      {
        method: req.method ?? "",
        userId: deps.getAuthUserId(req),
      },
      deps
    );
    return res.status(result.status).json(result.body);
  };
}

export function createAdminSupportersSearchHandler(deps: SupportersSearchDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const result = await handleAdminSupportersSearch(
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

export function createAdminSupportersUpdateHandler(deps: SupportersUpdateDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const body =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};
    const result = await handleAdminSupportersUpdate(
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
