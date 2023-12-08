import { NextApiRequest, NextApiResponse } from "next";
import { createUserFromClerk } from "../../../src/controllers/userController";
import prisma from "../../../prisma/prismaClient";

interface EmailObject {
  id: string;
  email_address: string;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const clerkData = req.body;
    console.log("Received webhook request with body:", req.body);
    console.error(
      JSON.stringify({
        level: "error",
        message: "Invalid clerk data",
        clerkData: clerkData,
      })
    );
    console.info(
      JSON.stringify({
        level: "info",
        message: "Processing user creation",
        clerkUserId: clerkData.data.id,
      })
    );

    if (!clerkData.data || !Array.isArray(clerkData.data.email_addresses)) {
      console.error("Invalid clerk data:", clerkData);
      return res.status(400).json({ error: "Invalid clerk data" });
    }

    const primaryEmailObj = clerkData.data.email_addresses.find(
      (emailObj: EmailObject) =>
        emailObj.id === clerkData.data.primary_email_address_id
    );
    const primaryEmail = primaryEmailObj ? primaryEmailObj.email_address : null;

    if (!primaryEmailObj) {
      console.error("Primary email object not found in clerk data:", clerkData);
      return res.status(400).json({ error: "Primary email object not found" });
    }

    const firstName = clerkData.data.first_name;
    const lastName = clerkData.data.last_name;
    const username = clerkData.data.username;
    const emailPrefix = primaryEmailObj?.email_address.split("@")[0];
    const clerkUserId = clerkData.data.id;

    const name =
      `${firstName || ""} ${lastName || ""}`.trim() || username || emailPrefix;

    const userData = {
      email: primaryEmail,
      name: name,
      clerkUserId: clerkData.data.id,
    };

    let existingUser;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { clerkUserId },
          data: { name: username },
        });
        res
          .status(200)
          .json({ success: true, message: "User updated successfully" });
      } else {
        const user = await createUserFromClerk(userData);
        res
          .status(200)
          .json({ success: true, message: "User created successfully" });
      }
    } catch (error) {
      const anyError = error as any;
      console.error(
        JSON.stringify({
          level: "error",
          message: "Error in processing webhook",
          error: anyError.message,
          stack: anyError.stack,
          clerkUserId: clerkData.data.id,
        })
      );
      console.error(
        `Error ${
          existingUser ? "updating" : "creating"
        } user in database from Clerk webhook:`,
        anyError.message
      );
      res.status(500).json({ success: false, message: anyError.message });
    }
  } else {
    console.warn("Unexpected method:", req.method);
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
};
