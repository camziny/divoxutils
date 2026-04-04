import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { getStripeClient, getStripePriceMap } from "@/server/billing/stripe";
import { createCheckoutSessionHandler } from "@/server/api/billingRouteHandlers";

const postHandler = createCheckoutSessionHandler({
  getAuthUserId: async () => (await auth()).userId,
  getPriceMap: getStripePriceMap,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true, stripeCustomerId: true, subscriptionStatus: true },
    }),
  createCheckoutSession: async ({ tier, priceId, clerkUserId, customerId, origin }) =>
    getStripeClient().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: clerkUserId,
      customer: customerId ?? undefined,
      metadata: {
        clerkUserId,
        tier: String(tier),
      },
      subscription_data: {
        metadata: {
          clerkUserId,
        },
      },
      success_url: `${origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?checkout=cancel`,
    }),
});

const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await postHandler({
    method: request.method,
    body,
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
