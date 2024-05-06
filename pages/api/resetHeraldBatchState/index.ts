import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function resetHeraldBatchState(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    try {
      await prisma.heraldBatchState.upsert({
        where: { key: "lastProcessedCharacterId" },
        update: { lastProcessedCharacterId: 0 },
        create: {
          key: "lastProcessedCharacterId",
          lastProcessedCharacterId: 0,
        },
      });

      res
        .status(200)
        .json({ message: "Herald batch state reset successfully" });
    } catch (error) {
      console.error("Error resetting herald batch state:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
