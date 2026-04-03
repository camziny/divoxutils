import { NextApiRequest, NextApiResponse } from "next";
import { type UserByClerkIdDeps, handleUserByClerkIdApi } from "@/server/userByClerkIdApi";

export const createUserByClerkIdHandler =
  (deps: UserByClerkIdDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const clerkUserId =
      typeof req.query.clerkUserId === "string" ? req.query.clerkUserId : null;
    const idRaw = typeof req.query.id === "string" ? req.query.id : null;

    const result = await handleUserByClerkIdApi(
      {
        method: req.method ?? "",
        clerkUserId,
        idRaw,
        body: req.body,
      },
      deps
    );

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    if (result.bodyType === "empty") {
      return res.status(result.status).end();
    }

    if (result.bodyType === "text") {
      return res.status(result.status).end(result.body);
    }

    return res.status(result.status).json(result.body);
  };
