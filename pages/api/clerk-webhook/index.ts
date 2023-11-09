import { NextApiRequest, NextApiResponse } from "next";
import { createUserFromClerk } from "../../../src/controllers/userController";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const clerkData = req.body;
    const primaryEmailObj = clerkData.data.email_addresses.find(
      (emailObj: any) => emailObj.id === clerkData.data.primary_email_address_id
    );

    const firstName = clerkData.data.first_name;
    const lastName = clerkData.data.last_name;
    const username = clerkData.data.username;
    const emailPrefix = primaryEmailObj?.email_address.split("@")[0];

    const name =
      `${firstName || ""} ${lastName || ""}`.trim() || username || emailPrefix;

    const userData = {
      email: primaryEmailObj?.email_address,
      name: name,
      clerkUserId: clerkData.data.id,
    };

    try {
      const user = await createUserFromClerk(userData);

      res
        .status(200)
        .json({ success: true, message: "User created successfully" });
    } catch (error) {
      const anyError = error as any;
      console.error(
        "Error creating user in database from Clerk webhook:",
        anyError.message
      );
      res.status(500).json({ success: false, message: anyError.message });
    }
  } else {
    console.warn("Unexpected method:", req.method);
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
};
