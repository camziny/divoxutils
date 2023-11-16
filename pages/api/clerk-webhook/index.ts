import { NextApiRequest, NextApiResponse } from "next";
import {
  createUserFromClerk,
  updateUserFromClerk,
} from "../../../src/controllers/userController";
import prisma from "../../../prisma/prismaClient";
import { clerkClient } from "@clerk/nextjs";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const evt = req.body.evt as WebhookEvent;
    console.log("Webhook event received:", evt);
    const clerkData = req.body;
    const primaryEmailObj = clerkData.data.email_addresses.find(
      (emailObj: any) => emailObj.id === clerkData.data.primary_email_address_id
    );

    const firstName = clerkData.data.first_name;
    const lastName = clerkData.data.last_name;
    const username = clerkData.data.username;
    const emailPrefix = primaryEmailObj?.email_address.split("@")[0];
    const clerkUserId = clerkData.data.id;

    const name =
      `${firstName || ""} ${lastName || ""}`.trim() || username || emailPrefix;

    const userData = {
      email: primaryEmailObj?.email_address,
      name: name,
      clerkUserId: clerkData.data.id,
    };

    let existingUser;

    try {
      console.log("Checking for existing user in database");
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
