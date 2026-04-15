import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createUserFromClerk } from "@/server/services/userService";
import prisma from "../../../../prisma/prismaClient";
import { createClerkWebhookHandler } from "@/server/api/clerkWebhookRouteHandler";
import { jsonMethodNotAllowed } from "@/server/api/routeHandlers";

export const runtime = "nodejs";

const postHandler = createClerkWebhookHandler({
  deleteLocalUserByClerkId: async (clerkUserId) => {
    const users = await prisma.user.findMany({
      where: { clerkUserId },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);

    await prisma.$transaction([
      prisma.groupUser.deleteMany({ where: { clerkUserId } }),
      prisma.userCharacter.deleteMany({ where: { clerkUserId } }),
      prisma.account.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.user.deleteMany({ where: { clerkUserId } }),
    ]);
  },
  findLocalUserByClerkId: async (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { clerkUserId: true },
    }),
  updateLocalUsername: async (clerkUserId, username) => {
    await prisma.user.update({
      where: { clerkUserId },
      data: { name: username },
    });
  },
  createLocalUserFromClerk: createUserFromClerk,
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
});

const runPost = async (request: Request) => {
  const rawBody = await request.text();
  const result = await postHandler({
    method: request.method,
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
    rawBody,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET ?? process.env.WEBHOOK_SECRET ?? null,
  });
  return NextResponse.json(result.body, { status: result.status });
};

export async function POST(request: Request) {
  return runPost(request);
}

export async function GET() {
  return jsonMethodNotAllowed("POST");
}

export async function PUT() {
  return jsonMethodNotAllowed("POST");
}

export async function PATCH() {
  return jsonMethodNotAllowed("POST");
}

export async function DELETE() {
  return jsonMethodNotAllowed("POST");
}
