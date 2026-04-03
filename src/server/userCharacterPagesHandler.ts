import { NextApiRequest, NextApiResponse } from "next";
import {
  type UserCharacterHandlerDeps,
  handleUserCharacterApi,
} from "@/server/userCharacterApi";

type PagesDeps = UserCharacterHandlerDeps & {
  getAuthUserId: (req: NextApiRequest) => string | null;
};

export const createUserCharacterHandler =
  (deps: PagesDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const clerkUserId =
      typeof req.query.clerkUserId === "string" ? req.query.clerkUserId : null;
    const characterIdRaw =
      typeof req.query.characterId === "string" ? req.query.characterId : null;

    const result = await handleUserCharacterApi(
      {
        method: req.method ?? "",
        clerkUserId,
        characterIdRaw,
        authUserId: deps.getAuthUserId(req),
      },
      deps
    );

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    if (result.bodyType === "text") {
      return res.status(result.status).end(result.body);
    }

    return res.status(result.status).json(result.body);
  };
