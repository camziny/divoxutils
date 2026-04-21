import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "../../../../../prisma/prismaClient";
import { getPayPalPlanMap, verifyPayPalWebhook } from "@/server/billing/paypal";
import { shouldGrantSupporterBadge } from "@/server/billing/stripe";
import { createPayPalWebhookHandler } from "@/server/api/paypalWebhookRouteHandler";

export const runtime = "nodejs";

const postHandler = createPayPalWebhookHandler({
  markEventProcessed: async (externalEventId) => {
    try {
      await prisma.billingWebhookEvent.create({
        data: {
          provider: "paypal",
          externalEventId,
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return false;
      }
      throw error;
    }
  },
  unmarkEventProcessed: async (externalEventId) => {
    await prisma.billingWebhookEvent.deleteMany({
      where: {
        provider: "paypal",
        externalEventId,
      },
    });
  },
  verifyWebhook: (params) => verifyPayPalWebhook(params),
  getPlanMap: getPayPalPlanMap,
  shouldGrantSupporterBadge,
  findUserByClerkUserId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        clerkUserId: true,
        subscriptionProvider: true,
        subscriptionProviderUpdatedAt: true,
        stripeSubscriptionId: true,
        paypalSubscriptionId: true,
        subscriptionPriceId: true,
        pendingSubscriptionPriceId: true,
        subscriptionCurrentPeriodEnd: true,
      },
    }),
  findUserByPayPalSubscriptionId: (paypalSubscriptionId) =>
    prisma.user.findFirst({
      where: { paypalSubscriptionId },
      select: {
        clerkUserId: true,
        subscriptionProvider: true,
        subscriptionProviderUpdatedAt: true,
        stripeSubscriptionId: true,
        paypalSubscriptionId: true,
        subscriptionPriceId: true,
        pendingSubscriptionPriceId: true,
        subscriptionCurrentPeriodEnd: true,
      },
    }),
  findUserByPayPalPayerId: (paypalPayerId) =>
    prisma.user.findFirst({
      where: { paypalPayerId },
      select: {
        clerkUserId: true,
        subscriptionProvider: true,
        subscriptionProviderUpdatedAt: true,
        stripeSubscriptionId: true,
        paypalSubscriptionId: true,
        subscriptionPriceId: true,
        pendingSubscriptionPriceId: true,
        subscriptionCurrentPeriodEnd: true,
      },
    }),
  updateUserSubscription: (clerkUserId, data) =>
    prisma.user.update({
      where: { clerkUserId },
      data,
    }).then(() => {}),
});

const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });

const runPost = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid PayPal webhook payload." }, { status: 400 });
  }
  const result = await postHandler({
    method: request.method,
    headers: request.headers,
    body,
  });
  return NextResponse.json(result.body, { status: result.status });
};

export async function POST(request: Request) {
  return runPost(request);
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
