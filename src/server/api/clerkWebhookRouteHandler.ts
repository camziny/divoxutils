import crypto from "crypto";

interface EmailObject {
  id: string;
  email_address: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: EmailObject[];
    primary_email_address_id?: string;
  };
}

type UserData = {
  email: string;
  name?: string | null;
  clerkUserId: string;
};

type WebhookDeps = {
  deleteLocalUserByClerkId: (clerkUserId: string) => Promise<void>;
  findLocalUserByClerkId: (clerkUserId: string) => Promise<{
    clerkUserId: string;
  } | null>;
  updateLocalUsername: (clerkUserId: string, username: string | null) => Promise<void>;
  createLocalUserFromClerk: (userData: UserData) => Promise<unknown>;
  markEventProcessed: (eventId: string) => Promise<boolean>;
  unmarkEventProcessed: (eventId: string) => Promise<void>;
};

export type ClerkWebhookInput = {
  method: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  rawBody: string;
  webhookSecret: string | null;
};

export type ClerkWebhookResponse = {
  status: number;
  body:
    | { success: false; message: string }
    | { success: true; message: string }
    | { error: string };
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
  const expected = crypto.createHmac("sha256", key).update(signedContent).digest("base64");

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

const resolveDisplayName = (data: ClerkWebhookEvent["data"]): string | null => {
  if (typeof data.username === "string" && data.username.trim().length > 0) {
    return data.username.trim();
  }
  const first = typeof data.first_name === "string" ? data.first_name.trim() : "";
  const last = typeof data.last_name === "string" ? data.last_name.trim() : "";
  const joined = `${first} ${last}`.trim();
  return joined.length > 0 ? joined : null;
};

export const createClerkWebhookHandler =
  (deps: WebhookDeps) =>
  async (input: ClerkWebhookInput): Promise<ClerkWebhookResponse> => {
    if (input.method !== "POST") {
      return { status: 405, body: { success: false, message: "Method not allowed" } };
    }

    if (!input.webhookSecret) {
      return {
        status: 500,
        body: { success: false, message: "Missing CLERK_WEBHOOK_SECRET" },
      };
    }

    if (!input.svixId || !input.svixTimestamp || !input.svixSignature) {
      return { status: 400, body: { success: false, message: "Missing Svix headers" } };
    }

    let event: ClerkWebhookEvent;
    try {
      const isValid = verifySvixSignature({
        payload: input.rawBody,
        secret: input.webhookSecret,
        svixId: input.svixId,
        svixTimestamp: input.svixTimestamp,
        svixSignature: input.svixSignature,
      });
      if (!isValid) {
        return { status: 401, body: { success: false, message: "Invalid webhook signature" } };
      }
      event = JSON.parse(input.rawBody) as ClerkWebhookEvent;
    } catch {
      return { status: 401, body: { success: false, message: "Invalid webhook signature" } };
    }

    const dedupKey = `clerk:${input.svixId}`;

    try {
      if (!event.data || typeof event.data.id !== "string" || event.data.id.length === 0) {
        return { status: 400, body: { error: "Invalid clerk data" } };
      }

      const emailAddresses = Array.isArray(event.data.email_addresses)
        ? event.data.email_addresses
        : null;

      if (event.type !== "user.deleted" && !emailAddresses) {
        return { status: 400, body: { error: "Invalid clerk data" } };
      }

      let primaryEmailObj: EmailObject | undefined;

      if (event.type !== "user.deleted") {
        primaryEmailObj = emailAddresses?.find(
          (emailObj: EmailObject) => emailObj.id === event.data.primary_email_address_id
        );

        if (!primaryEmailObj) {
          return { status: 400, body: { error: "Primary email object not found" } };
        }
      }

      const wasMarked = await deps.markEventProcessed(dedupKey);
      if (!wasMarked) {
        return { status: 200, body: { success: true, message: "Duplicate event ignored" } };
      }

      if (event.type === "user.deleted") {
        await deps.deleteLocalUserByClerkId(event.data.id);
        return { status: 200, body: { success: true, message: "User deleted successfully" } };
      }

      if (!primaryEmailObj) {
        return { status: 400, body: { error: "Primary email object not found" } };
      }

      const userData = {
        email: primaryEmailObj.email_address,
        name: resolveDisplayName(event.data),
        clerkUserId: event.data.id,
      };

      const existingUser = await deps.findLocalUserByClerkId(userData.clerkUserId);

      if (existingUser) {
        await deps.updateLocalUsername(event.data.id, resolveDisplayName(event.data));
        return { status: 200, body: { success: true, message: "User updated successfully" } };
      }

      await deps.createLocalUserFromClerk(userData);
      return { status: 200, body: { success: true, message: "User created successfully" } };
    } catch (error) {
      await deps.unmarkEventProcessed(dedupKey);
      if (event?.type === "user.deleted") {
        return { status: 500, body: { success: false, message: "Error in deleting user" } };
      }
      const message =
        error instanceof Error ? error.message : "Webhook processing failed";
      return { status: 500, body: { success: false, message } };
    }
  };
