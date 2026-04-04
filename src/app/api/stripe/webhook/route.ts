import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "../../../../../prisma/prismaClient";
import {
  extractRecurringPriceId,
  getStripeClient,
  getStripePriceMap,
  getStripeWebhookSecret,
  getTierFromPriceId,
  shouldGrantSupporterBadge,
} from "@/server/billing/stripe";
import { createStripeWebhookHandler } from "@/server/api/stripeWebhookRouteHandler";

export const runtime = "nodejs";

const postHandler = createStripeWebhookHandler({
  getWebhookSecret: getStripeWebhookSecret,
  constructEvent: (rawBody, signature, secret) =>
    getStripeClient().webhooks.constructEvent(rawBody, signature, secret),
  getPriceMap: getStripePriceMap,
  markEventProcessed: async (eventId) => {
    try {
      await prisma.stripeWebhookEvent.create({ data: { id: eventId } });
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
  unmarkEventProcessed: async (eventId) => {
    await prisma.stripeWebhookEvent.deleteMany({
      where: { id: eventId },
    });
  },
  findUserByClerkUserId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true },
    }),
  findUserByStripeCustomerId: (stripeCustomerId) =>
    prisma.user.findFirst({
      where: { stripeCustomerId },
      select: { clerkUserId: true },
    }),
  updateUserSubscription: async (clerkUserId, data) => {
    await prisma.user.update({
      where: { clerkUserId },
      data,
    });
  },
  extractRecurringPriceId,
  getTierFromPriceId,
  shouldGrantSupporterBadge,
});

const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });

const runPost = async (request: Request) => {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("stripe-signature");
  const result = await postHandler({
    method: request.method,
    signature,
    rawBody,
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
