import React from "react";
import NavbarClient from "./components/NavbarClient";

const Navbar = () => {
  return (
    <nav className="bg-gray-900 border-b border-gray-800/50 sticky top-0 z-50">
      <NavbarClient />
    </nav>
  );
};

export default Navbar;
