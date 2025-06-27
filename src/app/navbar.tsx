import React from "react";
import { auth } from "@clerk/nextjs";
import NavbarClient from "./components/NavbarClient";

const Navbar = () => {
  const { userId } = auth();

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg shadow-gray-900/20 sticky top-0 z-50">
      <NavbarClient isUserSignedIn={!!userId} />
    </nav>
  );
};

export default Navbar;
