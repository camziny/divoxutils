import { NextApiRequest, NextApiResponse } from "next";
import { getDraftLogRows } from "@/server/draftStats";

export function createDraftLogHandler(deps?: {
  getRows?: () => Promise<unknown>;
}) {
  const getRows = deps?.getRows ?? getDraftLogRows;

  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const rows = await getRows();
      return res.status(200).json({ rows });
    } catch {
      return res.status(500).json({ error: "Failed to load draft log." });
    }
  };
}

export default createDraftLogHandler();
