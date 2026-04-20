import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import {
  createPayPalSubscription,
  getPayPalPlanMap,
  isPayPalSubscriptionsEnabled,
} from "@/server/billing/paypal";
import { createPayPalSubscriptionHandler } from "@/server/api/billingRouteHandlers";

const postHandler = createPayPalSubscriptionHandler({
  getAuthUserId: async () => (await auth()).userId,
  getPlanMap: getPayPalPlanMap,
  isPayPalEnabled: isPayPalSubscriptionsEnabled,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true, subscriptionStatus: true },
    }),
  createPayPalSubscription: ({ planId, clerkUserId, tier, origin }) =>
    createPayPalSubscription({
      planId,
      clerkUserId,
      tier,
      origin,
    }),
  recordPayPalSubscription: async ({
    clerkUserId,
    paypalSubscriptionId,
    paypalPayerId,
    subscriptionStatus,
    subscriptionPriceId,
  }) => {
    await prisma.user.update({
      where: { clerkUserId },
      data: {
        subscriptionProvider: "paypal",
        subscriptionProviderUpdatedAt: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        paypalSubscriptionId,
        paypalPayerId,
        subscriptionStatus,
        subscriptionPriceId,
        pendingSubscriptionPriceId: null,
        subscriptionCancelAtPeriodEnd: false,
      },
    });
  },
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
