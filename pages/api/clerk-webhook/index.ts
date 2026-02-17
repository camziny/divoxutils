import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { createUserFromClerk } from "../../../src/controllers/userController";
import prisma from "../../../prisma/prismaClient";

interface EmailObject {
  id: string;
  email_address: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    username?: string | null;
    email_addresses?: EmailObject[];
    primary_email_address_id?: string;
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const readRawBody = async (req: NextApiRequest): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const parseSecret = (secret: string) => {
  const value = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  return Buffer.from(value, "base64");
};

const safeCompare = (a: string, b: string) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifySvixSignature = ({
  payload,
  secret,
  svixId,
  svixTimestamp,
  svixSignature,
}: {
  payload: string;
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
}) => {
  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  const key = parseSecret(secret);
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");

  const signatures = svixSignature
    .trim()
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const signaturePart of signatures) {
    const [version, signature] = signaturePart.split(",");
    if (version === "v1" && signature && safeCompare(signature, expected)) {
      return true;
    }
  }

  return false;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res
      .status(500)
      .json({ success: false, message: "Missing CLERK_WEBHOOK_SECRET" });
  }

  const svixId = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  if (
    typeof svixId !== "string" ||
    typeof svixTimestamp !== "string" ||
    typeof svixSignature !== "string"
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing Svix headers" });
  }

  let event: ClerkWebhookEvent;
  try {
    const rawBody = await readRawBody(req);
    const isValid = verifySvixSignature({
      payload: rawBody,
      secret: webhookSecret,
      svixId,
      svixTimestamp,
      svixSignature,
    });
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid webhook signature" });
    }
    event = JSON.parse(rawBody) as ClerkWebhookEvent;
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid webhook signature" });
  }

  if (event.type === "user.deleted") {
    try {
      await prisma.user.deleteMany({
        where: { clerkUserId: event.data.id },
      });
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error in deleting user" });
    }
  }

  if (!event.data || !Array.isArray(event.data.email_addresses)) {
    return res.status(400).json({ error: "Invalid clerk data" });
  }

  const primaryEmailObj = event.data.email_addresses.find(
    (emailObj: EmailObject) =>
      emailObj.id === event.data.primary_email_address_id
  );

  if (!primaryEmailObj) {
    return res.status(400).json({ error: "Primary email object not found" });
  }

  const userData = {
    email: primaryEmailObj.email_address,
    name: event.data.username,
    clerkUserId: event.data.id,
  };

  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userData.clerkUserId },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { clerkUserId: event.data.id },
        data: { name: event.data.username },
      });
      return res
        .status(200)
        .json({ success: true, message: "User updated successfully" });
    }

    const newUser = await createUserFromClerk(userData);
    return res
      .status(200)
      .json({ success: true, message: "User created successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default handler;
