"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import UpdateUsernameModal from "./UpdateUserNameModal";
type NavbarClientProps = {
  isUserSignedIn: boolean;
};

const NAV_LINKS = [
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/search", label: "Search" },
  { href: "/realm-ranks", label: "Realm Ranks" },
  { href: "/discord", label: "Discord" },
  { href: "/about", label: "About" },
];

const NavbarClient: React.FC<NavbarClientProps> = ({ isUserSignedIn }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const { user } = useUser();
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();

  const handleUsernameUpdated = (newUsername: string) => {
    setUserName(newUsername);
  };

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${user.id}`)
        .then((res) => res.json())
        .then((data) => setUserName(data.name));
    }
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="relative flex h-14 items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight hover:text-gray-300 transition-colors lg:justify-self-start"
        >
          <span className="text-indigo-400">d</span>
          <span className="text-white">u</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 lg:justify-self-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                pathname === link.href || pathname?.startsWith(link.href + "/")
                  ? "text-white bg-gray-800/60"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 lg:justify-self-end">
          {isUserSignedIn ? (
            <>
              <Link
                href="/user-characters"
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  pathname === "/user-characters"
                    ? "text-white bg-gray-800/60"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                }`}
              >
                My Characters
              </Link>
              {userName && (
                <button
                  onClick={() => setUsernameModalOpen(true)}
                  className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {userName}
                </button>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md border border-gray-700 px-3 py-1.5 text-[13px] font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden relative w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col gap-[5px]">
            <span
              className={`block h-[1.5px] w-4 bg-current transition-all duration-200 ${
                menuOpen ? "translate-y-[6.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] w-4 bg-current transition-all duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] w-4 bg-current transition-all duration-200 ${
                menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-gray-900">
          <div className="flex flex-col px-4 py-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === link.href || pathname?.startsWith(link.href + "/")
                    ? "text-white bg-gray-800/60"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-800 my-3" />

            {isUserSignedIn ? (
              <>
                <Link
                  href="/user-characters"
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === "/user-characters"
                      ? "text-white bg-gray-800/60"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                  }`}
                >
                  My Characters
                </Link>
                {userName && (
                  <button
                    onClick={() => {
                      setUsernameModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white text-left transition-colors"
                  >
                    {userName}
                  </button>
                )}
                <div className="px-3 py-2.5">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Link
                  href="/sign-in"
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <UpdateUsernameModal
        isOpen={usernameModalOpen}
        onClose={() => setUsernameModalOpen(false)}
        onUserNameUpdated={handleUsernameUpdated}
      />
    </div>
  );
};

export default NavbarClient;
