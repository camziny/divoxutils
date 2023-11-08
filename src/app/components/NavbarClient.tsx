"use client";
import React, { useState } from "react";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { UserButton } from "@clerk/nextjs";

type NavbarClientProps = {
  isUserSignedIn: boolean;
};

const NavbarClient: React.FC<NavbarClientProps> = ({ isUserSignedIn }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gray-800 p-5 text-white">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link href="/">
          <div className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer">
            <HomeIcon />
            <span className="ml-1">Home</span>
          </div>
        </Link>

        <button
          onClick={toggleMenu}
          className="text-white md:hidden focus:outline-none focus:ring-2 focus:ring-gray-600 p-2 rounded hover:bg-gray-700"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div
          className={`${
            isMenuOpen ? "block" : "hidden"
          } md:flex flex-grow justify-end items-center w-full md:w-auto`}
        >
          <div className="flex flex-col md:flex-row md:space-x-4 mt-4 md:mt-0">
            <Link href="/about">
              <div className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer">
                About
              </div>
            </Link>
            {isUserSignedIn && (
              <>
                <Link href="/user-characters">
                  <div className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer">
                    My Characters
                  </div>
                </Link>
                <Link href="/search">
                  <div className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer">
                    <SearchIcon className="mr-1" />
                    Search Users
                  </div>
                </Link>
              </>
            )}
            {!isUserSignedIn && (
              <>
                <Link href="/sign-in">
                  <div className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer">
                    Sign In
                  </div>
                </Link>
                <Link href="/sign-up">
                  <div className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer">
                    Register
                  </div>
                </Link>
              </>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarClient;
