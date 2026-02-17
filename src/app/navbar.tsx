import React from "react";
import { auth } from "@clerk/nextjs";
import NavbarClient from "./components/NavbarClient";

const Navbar = () => {
  const { userId } = auth();

  return (
    <nav className="bg-gray-900 border-b border-gray-800/50 sticky top-0 z-50">
      <NavbarClient isUserSignedIn={!!userId} />
    </nav>
  );
};

export default Navbar;
