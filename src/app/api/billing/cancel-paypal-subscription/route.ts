import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../prisma/prismaClient";
import { cancelPayPalSubscription, isPayPalSubscriptionsEnabled } from "@/server/billing/paypal";
import { cancelPayPalSubscriptionHandler } from "@/server/api/billingRouteHandlers";

const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });

const postHandler = cancelPayPalSubscriptionHandler({
  getAuthUserId: async () => (await auth()).userId,
  isPayPalEnabled: isPayPalSubscriptionsEnabled,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        clerkUserId: true,
        subscriptionProvider: true,
        paypalSubscriptionId: true,
      },
    }),
  cancelPayPalSubscription: ({ paypalSubscriptionId, reason }) =>
    cancelPayPalSubscription(paypalSubscriptionId, reason),
  markPayPalSubscriptionCancelAtPeriodEnd: async ({ clerkUserId }) => {
    await prisma.user.update({
      where: { clerkUserId },
      data: {
        subscriptionCancelAtPeriodEnd: true,
        pendingSubscriptionPriceId: null,
      },
    });
  },
});

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
