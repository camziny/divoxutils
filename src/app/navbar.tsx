import React from "react";
import NavbarClient from "./components/NavbarClient";
import { auth } from "@clerk/nextjs/server";
import { isAdminClerkUserId } from "@/server/adminAuth";

const Navbar = async () => {
  const { userId } = auth();
  const isAdmin = isAdminClerkUserId(userId);

  return (
    <nav className="bg-gray-900 border-b border-gray-800/50 sticky top-0 z-50">
      <NavbarClient isAdmin={isAdmin} />
    </nav>
  );
};

export default Navbar;
