import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../prisma/prismaClient";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { createSupporterDeviceHandler } from "@/server/api/supporterDeviceRouteHandler";
import {
  createSupporterDeviceGraceCookieValue,
  SUPPORTER_DEVICE_GRACE_COOKIE_NAME,
  SUPPORTER_DEVICE_GRACE_MAX_AGE_SECONDS,
} from "@/server/supporterDeviceGrace";

export const runtime = "nodejs";

const postHandler = createSupporterDeviceHandler({
  getAuthUserId: async () => (await auth()).userId,
  isAdminClerkUserId,
  findUserByClerkId: (clerkUserId) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        supporterTier: true,
        subscriptionStatus: true,
        subscriptionCancelAtPeriodEnd: true,
        subscriptionCurrentPeriodEnd: true,
      },
    }),
  createCookieValue: () => createSupporterDeviceGraceCookieValue(),
});

const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });

export async function POST(request: Request) {
  const result = await postHandler({ method: request.method });
  const response = NextResponse.json(result.body, { status: result.status });

  if (result.cookieAction === "set" && result.cookieValue) {
    response.cookies.set(SUPPORTER_DEVICE_GRACE_COOKIE_NAME, result.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SUPPORTER_DEVICE_GRACE_MAX_AGE_SECONDS,
    });
  }

  if (result.cookieAction === "clear") {
    response.cookies.set(SUPPORTER_DEVICE_GRACE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
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
