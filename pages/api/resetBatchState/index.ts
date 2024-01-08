import prisma from "../../../prisma/prismaClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function resetBatchState(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await prisma.batchState.upsert({
      where: { key: "lastProcessedCharacterId" },
      update: { value: 0 },
      create: { key: "lastProcessedCharacterId", value: 0 },
    });

    res.status(200).json({ message: "Batch state reset successfully" });
  } catch (error) {
    console.error("Error resetting batch state:", error);
    res.status(500).json({ message: "Error resetting batch state" });
  }
}
