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
    <nav className="text-white p-4">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link href="/">
          <div className="group flex items-center px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10">
            <HomeIcon className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
            <span className="ml-2 font-semibold group-hover:text-white transition-colors duration-300">Home</span>
          </div>
        </Link>

        <button
          onClick={toggleMenu}
          className="text-white lg:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/50 p-3 rounded-xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-indigo-500/30"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <div
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row flex-grow justify-between items-center w-full lg:w-auto`}
        >
          <div className="flex flex-col lg:flex-row lg:space-x-2 mt-4 md:mt-0 w-full lg:w-auto lg:ml-auto">
            <Link href="/about">
              <div
                onClick={closeMenu}
                className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <span className="font-medium group-hover:text-white transition-colors duration-300">About</span>
              </div>
            </Link>
            {isUserSignedIn && (
              <>
                <Link href="/user-characters">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">My Characters</span>
                  </div>
                </Link>
                <Link href="/leaderboards">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Leaderboards</span>
                  </div>
                </Link>
                <Link href="/search">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Search</span>
                    <SearchIcon className="text-indigo-400 group-hover:text-indigo-300 ml-2 transition-colors duration-300" />
                  </div>
                </Link>
                <Link href="/discord">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Discord Bot</span>
                    <FaDiscord
                      className="text-indigo-400 group-hover:text-indigo-300 ml-2 transition-colors duration-300"
                      size={18}
                    />
                  </div>
                </Link>
                <div
                  className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  onClick={() => setIsUpdateUsernameModalOpen(true)}
                >
                  <span className="mr-2 font-semibold group-hover:text-white transition-colors duration-300">{userName}</span>
                  {userName && (
                    <EditIcon className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
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
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Leaderboards</span>
                  </div>
                </Link>
                <Link href="/search">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Search</span>
                    <SearchIcon className="text-indigo-400 group-hover:text-indigo-300 ml-2 transition-colors duration-300" />
                  </div>
                </Link>
                <Link href="/discord">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Discord Bot</span>
                    <FaDiscord
                      className="text-indigo-400 group-hover:text-indigo-300 ml-2 transition-colors duration-300"
                      size={18}
                    />
                  </div>
                </Link>
                <Link href="/sign-in">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <span className="font-medium group-hover:text-white transition-colors duration-300">Sign In</span>
                  </div>
                </Link>
                <Link href="/sign-up">
                  <div
                    onClick={closeMenu}
                    className="group px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 cursor-pointer w-full lg:w-auto text-sm lg:text-base flex items-center lg:justify-end border border-transparent hover:shadow-lg hover:shadow-indigo-500/25"
                  >
                    <span className="font-semibold text-white">Register</span>
                  </div>
                </Link>
              </>
            )}
            <div className="ml-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarClient;
