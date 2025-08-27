import { NextApiRequest, NextApiResponse } from "next";
import { createUserFromClerk } from "../../../src/controllers/userController";
import prisma from "../../../prisma/prismaClient";

interface EmailObject {
  id: string;
  email_address: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(
    JSON.stringify({
      level: "info",
      message: "Webhook received",
      method: req.method,
      body: req.body,
    })
  );

  if (req.method !== "POST") {
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "Unexpected method received",
        method: req.method,
      })
    );
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const clerkData = req.body;

  if (clerkData.type === "user.deleted") {
    try {
      await prisma.user.delete({
        where: { clerkUserId: clerkData.data.id },
      });
      console.log(`User deleted successfully: ${clerkData.data.id}`);
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error(`Error in deleting user: ${error}`);
      return res
        .status(500)
        .json({ success: false, message: "Error in deleting user" });
    }
  }

  if (!clerkData.data || !Array.isArray(clerkData.data.email_addresses)) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Invalid clerk data",
        clerkData: clerkData,
      })
    );
    return res.status(400).json({ error: "Invalid clerk data" });
  }

  const primaryEmailObj = clerkData.data.email_addresses.find(
    (emailObj: EmailObject) =>
      emailObj.id === clerkData.data.primary_email_address_id
  );

  if (!primaryEmailObj) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Primary email object not found in clerk data",
        clerkData: clerkData,
      })
    );
    return res.status(400).json({ error: "Primary email object not found" });
  }

  const userData = {
    email: primaryEmailObj.email_address,
    name: clerkData.data.username,
    clerkUserId: clerkData.data.id,
  };

  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userData.clerkUserId },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { clerkUserId: clerkData.data.id },
        data: { name: clerkData.data.username },
      });
      console.log(
        JSON.stringify({
          level: "info",
          message: "User updated successfully",
          userId: existingUser.id,
        })
      );
      return res
        .status(200)
        .json({ success: true, message: "User updated successfully" });
    }

    const newUser = await createUserFromClerk(userData);
    console.log(
      JSON.stringify({
        level: "info",
        message: "User created successfully",
        userId: newUser.id,
      })
    );
    return res
      .status(200)
      .json({ success: true, message: "User created successfully" });
  } catch (error: any) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Error in processing webhook",
        error: {
          message: error.message,
          stack: error.stack,
        },
        clerkUserId: userData.clerkUserId,
      })
    );
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default handler;
