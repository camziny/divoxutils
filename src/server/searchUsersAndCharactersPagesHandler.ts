import { NextApiRequest, NextApiResponse } from "next";
import {
  type SearchUsersAndCharactersDeps,
  handleSearchUsersAndCharactersApi,
} from "@/server/searchUsersAndCharactersApi";

export function createSearchUsersAndCharactersHandler(
  deps: SearchUsersAndCharactersDeps
) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const result = await handleSearchUsersAndCharactersApi(
      {
        method: req.method ?? "",
        nameQuery: req.query.name,
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
}
