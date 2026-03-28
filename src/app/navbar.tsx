import React from "react";
import NavbarClient from "./components/NavbarClient";
import { auth } from "@clerk/nextjs/server";
import { isAdminClerkUserId } from "@/server/adminAuth";
import prisma from "../../prisma/prismaClient";

const Navbar = async () => {
  let userId: string | null = null;
  let isSubscribed = false;
  try {
    const authData = await auth();
    userId = authData.userId;
  } catch {
    userId = null;
  }
  const isAdmin = isAdminClerkUserId(userId);
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { supporterTier: true },
      });
      isSubscribed = (user?.supporterTier ?? 0) > 0;
    } catch {
      isSubscribed = false;
    }
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800/50 sticky top-0 z-50">
      <NavbarClient isAdmin={isAdmin} isSubscribed={isSubscribed} />
    </nav>
  );
};

export default Navbar;
