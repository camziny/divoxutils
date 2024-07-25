import React from "react";
import { auth } from "@clerk/nextjs";
import NavbarClient from "./components/NavbarClient";

const Navbar = () => {
  const { userId } = auth();

  return (
    <nav className="bg-gray-800 p-4 text-white shadow-md">
      <NavbarClient isUserSignedIn={!!userId} />
    </nav>
  );
};

export default Navbar;
