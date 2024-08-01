import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { clerkUserId } = req.query;

    if (!clerkUserId || clerkUserId !== "user_2bca23YTkZd9oLKKWiGHA3pG38y") {
      return res
        .status(400)
        .json({ message: "Invalid or missing clerkUserId" });
    }

    await res.revalidate(`/user/team_tonka/characters`);

    return res
      .status(200)
      .json({ message: `Revalidated user with clerkUserId: ${clerkUserId}` });
  } catch (err) {
    return res.status(500).json({ message: "Error revalidating" });
  }
}
