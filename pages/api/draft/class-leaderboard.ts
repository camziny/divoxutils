import { NextApiRequest, NextApiResponse } from "next";
import { getClassDraftStats } from "@/server/draftStats";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const className =
    typeof req.query.className === "string" ? req.query.className.trim() : "";
  if (!className) {
    return res.status(400).json({ error: "Missing className" });
  }

  try {
    const rows = await getClassDraftStats(className, {});
    return res.status(200).json({ rows });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message ?? "Failed to load class leaderboard." });
  }
}
