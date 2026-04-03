import { NextApiRequest, NextApiResponse } from "next";
import {
  type UserCharactersByUserIdDeps,
  handleUserCharactersByUserIdApi,
} from "@/server/userCharactersByUserIdApi";

export const createUserCharactersByUserIdHandler =
  (deps: UserCharactersByUserIdDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const userId =
      typeof req.query.userId === "string" ? req.query.userId : null;

    const result = await handleUserCharactersByUserIdApi(
      {
        method: req.method ?? "",
        userId,
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
