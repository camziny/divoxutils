import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import {
  getPayPalPlanMap,
  isPayPalSubscriptionsEnabled,
  revisePayPalSubscriptionPlan,
} from "@/server/billing/paypal";
import { changePayPalPlanHandler } from "@/server/api/billingRouteHandlers";

const postHandler = changePayPalPlanHandler({
  getAuthUserId: async () => (await auth()).userId,
  getPlanMap: getPayPalPlanMap,
  isPayPalEnabled: isPayPalSubscriptionsEnabled,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        clerkUserId: true,
        subscriptionProvider: true,
        subscriptionStatus: true,
        subscriptionPriceId: true,
        pendingSubscriptionPriceId: true,
        paypalSubscriptionId: true,
      },
    }),
  revisePayPalSubscriptionPlan: ({ paypalSubscriptionId, planId }) =>
    revisePayPalSubscriptionPlan({ paypalSubscriptionId, planId }),
  updatePendingSubscriptionPriceId: async ({ clerkUserId, pendingSubscriptionPriceId }) => {
    await prisma.user.update({
      where: { clerkUserId },
      data: {
        pendingSubscriptionPriceId,
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
