import { NextApiRequest, NextApiResponse } from "next";
import { deleteUserByClerkUserId } from "@/controllers/userController";

const handleDeleteUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const apiSecret = process.env.DISCORD_BOT_API_KEY;
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== apiSecret) {
    res.status(401).json({ message: "Invalid or missing API key." });
    return;
  }

  if (req.method === "DELETE") {
    try {
      const { clerkUserId } = req.query;
      if (typeof clerkUserId === "string") {
        await deleteUserByClerkUserId(clerkUserId);
        res.status(204).end();
      } else {
        throw new Error("Invalid clerkUserId");
      }
    } catch (error) {
      console.error("Error in /api/delete/user/[clerkUserId]:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handleDeleteUser;
