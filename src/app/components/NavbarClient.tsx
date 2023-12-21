"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { UserButton } from "@clerk/nextjs";
import UpdateUsernameModal from "./UpdateUserNameModal";
import { useUser } from "@clerk/nextjs";
import EditIcon from "@mui/icons-material/Edit";
import useFetchUser from "./FetchUser";

type NavbarClientProps = {
  isUserSignedIn: boolean;
};

const NavbarClient: React.FC<NavbarClientProps> = ({ isUserSignedIn }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdateUsernameModalOpen, setIsUpdateUsernameModalOpen] =
    useState(false);
  const { user } = useUser();
  const { userData, isLoading } = useFetchUser(user?.id || " ");
  const [userName, setUserName] = useState<string | null>(null);

  const handleUsernameUpdated = (newUsername: string) => {
    setUserName(newUsername);
  };

  useEffect(() => {
    if (user) {
      setUserName(user.username);
    }
  }, [user]);

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
          className="text-white lg:hidden focus:outline-none focus:ring-2 focus:ring-gray-600 p-2 rounded hover:bg-gray-700"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div
          className={`${
            isMenuOpen ? "block" : "hidden"
          } lg:flex flex-grow justify-end items-center w-full lg:w-auto`}
        >
          <div className="flex flex-col md:flex-row md:space-x-4 mt-4 md:mt-0">
            <Link href="/about">
              <div
                onClick={closeMenu}
                className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
              >
                About
              </div>
            </Link>
            {isUserSignedIn && (
              <>
                <Link href="/user-characters">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    My Characters
                  </div>
                </Link>
                <Link href="/leaderboards">
                  <div
                    onClick={closeMenu}
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Leaderboards
                  </div>
                </Link>
                <Link href="/search">
                  <div
                    onClick={closeMenu}
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Search Users
                    <SearchIcon className="text-indigo-500 hover:text-indigo-600 cursor-pointer ml-1" />
                  </div>
                </Link>
                <Link href="/character-search">
                  <div
                    onClick={closeMenu}
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Search Characters
                    <SearchIcon className="text-indigo-500 hover:text-indigo-600 cursor-pointer ml-1" />
                  </div>
                </Link>
                <div
                  className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => setIsUpdateUsernameModalOpen(true)}
                >
                  <span className="mr-1 font-semibold">{userName}</span>
                  {userName && (
                    <EditIcon className="text-indigo-500 hover:text-indigo-600 cursor-pointer" />
                  )}
                </div>
                <UpdateUsernameModal
                  isOpen={isUpdateUsernameModalOpen}
                  onClose={() => setIsUpdateUsernameModalOpen(false)}
                  onUserNameUpdated={handleUsernameUpdated}
                />
              </>
            )}
            {!isUserSignedIn && (
              <>
                <Link href="/leaderboards">
                  <div
                    onClick={closeMenu}
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Leaderboards
                  </div>
                </Link>
                <Link href="/search">
                  <div
                    onClick={closeMenu}
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Search Users
                    <SearchIcon className="text-indigo-500 hover:text-indigo-600 cursor-pointer ml-1" />
                  </div>
                </Link>
                <Link href="/character-search">
                  <div
                    onClick={closeMenu}
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Search Characters
                    <SearchIcon className="text-indigo-500 hover:text-indigo-600 cursor-pointer ml-1" />
                  </div>
                </Link>
                <Link href="/sign-in">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Sign In
                  </div>
                </Link>
                <Link href="/sign-up">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                  >
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
