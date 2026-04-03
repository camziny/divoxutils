import { NextApiRequest, NextApiResponse } from "next";
import {
  type LinkedProfilesApiDeps,
  handleLinkedProfilesApi,
} from "@/server/draftLinkedProfilesApi";

export function createLinkedProfilesHandler(deps: LinkedProfilesApiDeps) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const result = await handleLinkedProfilesApi(
      {
        method: req.method ?? "",
        body: req.body,
      },
      deps
    );

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    return res.status(result.status).json(result.body);
  };
}
