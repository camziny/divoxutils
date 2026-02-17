import { NextApiRequest, NextApiResponse } from "next";
import { getLeaderboardData } from "../../../src/server/leaderboard";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const leaderboardData = await getLeaderboardData();
      res.status(200).json(leaderboardData);
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
      res.status(500).json({ message: "Error fetching leaderboard data" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
