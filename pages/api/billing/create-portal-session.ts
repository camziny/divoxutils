import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "../../../prisma/prismaClient";
import { getStripeClient } from "@/server/billing/stripe";

type PortalDeps = {
  getAuthUserId: (req: NextApiRequest) => string | null;
  findCustomerIdByClerkUserId: (clerkUserId: string) => Promise<string | null>;
  createPortalSession: (params: {
    customerId: string;
    returnUrl: string;
  }) => Promise<{ url: string }>;
};

const getRequestOrigin = (req: NextApiRequest): string => {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (envBaseUrl) return envBaseUrl;
  const host = (req.headers["x-forwarded-host"] ??
    req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
};

export const createPortalSessionHandler =
  (deps: PortalDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const clerkUserId = deps.getAuthUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const customerId = await deps.findCustomerIdByClerkUserId(clerkUserId);
    if (!customerId) {
      return res.status(404).json({ error: "No subscription found for this user." });
    }

    try {
      const session = await deps.createPortalSession({
        customerId,
        returnUrl: `${getRequestOrigin(req)}/billing`,
      });
      return res.status(200).json({ url: session.url });
    } catch {
      return res.status(500).json({ error: "Unable to create billing portal session." });
    }
  };

const handler = createPortalSessionHandler({
  getAuthUserId: (req) => getAuth(req).userId,
  findCustomerIdByClerkUserId: async (clerkUserId) => {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { stripeCustomerId: true },
    });
    return user?.stripeCustomerId ?? null;
  },
  createPortalSession: ({ customerId, returnUrl }) =>
    getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    }),
});

export default handler;
