import { NextApiRequest, NextApiResponse } from "next";
import {
  type CharactersSearchApiDeps,
  handleCharactersSearchApi,
} from "@/server/charactersSearchApi";

export const createCharactersSearchHandler =
  (deps: CharactersSearchApiDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const result = await handleCharactersSearchApi(
      {
        method: req.method ?? "",
        name: typeof req.query.name === "string" ? req.query.name : null,
        cluster: typeof req.query.cluster === "string" ? req.query.cluster : null,
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
