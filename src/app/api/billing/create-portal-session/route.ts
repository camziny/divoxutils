import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { getStripeClient } from "@/server/billing/stripe";
import { createPortalSessionHandler } from "@/server/api/billingRouteHandlers";

const postHandler = createPortalSessionHandler({
  getAuthUserId: async () => (await auth()).userId,
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

const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });

export async function POST(request: Request) {
  const result = await postHandler({
    method: request.method,
    body: null,
    headers: request.headers,
  });
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
