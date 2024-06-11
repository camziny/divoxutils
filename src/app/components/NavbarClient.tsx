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
import ConstructionIcon from "@mui/icons-material/Construction";
import useFetchGroupByClerkUserId from "./FetchGroupUserName";
import { FaDiscord } from "react-icons/fa";

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

  const { groupData, error } = useFetchGroupByClerkUserId(user?.id || "");

  const groupName = groupData?.name;

  const handleUsernameUpdated = (newUsername: string) => {
    setUserName(newUsername);
  };

  const fetchUserName = async (clerkUserId: string) => {
    const response = await fetch(`/api/users/${clerkUserId}`);
    const data = await response.json();
    return data.name;
  };

  useEffect(() => {
    if (user) {
      fetchUserName(user.id).then(setUserName);
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
            isMenuOpen ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row flex-grow justify-between items-center w-full lg:w-auto`}
        >
          <div className="flex flex-col lg:flex-row lg:space-x-4 mt-4 md:mt-0 w-full lg:w-auto lg:ml-auto">
            <Link href="/about">
              <div
                onClick={closeMenu}
                className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
              >
                About
              </div>
            </Link>
            {isUserSignedIn && (
              <>
                <Link href="/user-characters">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    My Characters
                  </div>
                </Link>
                <Link href="/group-builder">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    <span>Group Builder</span>
                    <ConstructionIcon className="text-indigo-500 hover:text-indigo-600 ml-1" />
                  </div>
                </Link>
                <Link href={userName ? `/user/${userName}/group` : "#"}>
                  <div
                    onClick={userName ? closeMenu : undefined}
                    className={`px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end ${
                      !userName ? "cursor-not-allowed" : ""
                    }`}
                  >
                    My Group
                  </div>
                </Link>
                <Link href="/leaderboards">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    Leaderboards
                  </div>
                </Link>
                <Link href="/search">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    <span>Search</span>
                    <SearchIcon className="text-indigo-500 hover:text-indigo-600 ml-1" />
                  </div>
                </Link>
                <Link href="/discord">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    <span>Discord Bot</span>
                    <FaDiscord
                      className="text-indigo-500 hover:text-indigo-600 ml-2"
                      size={20}
                    />
                  </div>
                </Link>
                <div
                  className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  onClick={() => setIsUpdateUsernameModalOpen(true)}
                >
                  <span className="mr-1 font-semibold">{userName}</span>
                  {userName && (
                    <EditIcon className="text-indigo-500 hover:text-indigo-600" />
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
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    Leaderboards
                  </div>
                </Link>
                <Link href="/search">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    <span>Search</span>
                    <SearchIcon className="text-indigo-500 hover:text-indigo-600 ml-1" />
                  </div>
                </Link>
                <Link href="/discord">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    <span>Discord Bot</span>
                    <FaDiscord
                      className="text-indigo-500 hover:text-indigo-600 ml-2"
                      size={20}
                    />
                  </div>
                </Link>
                <Link href="/sign-in">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
                  >
                    Sign In
                  </div>
                </Link>
                <Link href="/sign-up">
                  <div
                    onClick={closeMenu}
                    className="px-3 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end"
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
