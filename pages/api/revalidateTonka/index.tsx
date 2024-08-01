import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Revalidate API hit");

  try {
    const { clerkUserId } = req.query;
    console.log("Received clerkUserId:", clerkUserId);

    if (!clerkUserId || clerkUserId !== "user_2bca23YTkZd9oLKKWiGHA3pG38y") {
      console.log("Invalid or missing clerkUserId");
      return res
        .status(400)
        .json({ message: "Invalid or missing clerkUserId" });
    }

    console.log("Attempting to revalidate path: /user/team_tonka/characters");
    await res.revalidate(`/user/team_tonka/characters`);
    console.log("Revalidation successful");

    return res
      .status(200)
      .json({ message: `Revalidated user with clerkUserId: ${clerkUserId}` });
  } catch (err) {
    console.error("Error during revalidation:", err);
    return res
      .status(500)
      .json({ message: "Error revalidating", error: err?.toString() });
  }
}
