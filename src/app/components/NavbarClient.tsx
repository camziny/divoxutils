"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/search", label: "Search" },
  { href: "/realm-ranks", label: "Realm Ranks" },
  { href: "/discord", label: "Discord" },
  { href: "/about", label: "About" },
];

type NavbarClientProps = {
  isAdmin: boolean;
};

const NavbarClient: React.FC<NavbarClientProps> = ({ isAdmin }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoverIndicator, setHoverIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const links = useMemo(
    () => (isAdmin ? [...NAV_LINKS, { href: "/admin", label: "Admin" }] : NAV_LINKS),
    [isAdmin]
  );

  const isActive = useCallback(
    (href: string) => pathname === href || pathname?.startsWith(href + "/"),
    [pathname]
  );

  const measureLink = useCallback(
    (href: string) => {
      const navEl = navRef.current;
      const linkEl = linkRefs.current.get(href);
      if (!navEl || !linkEl) return null;
      const navRect = navEl.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();
      return { left: linkRect.left - navRect.left, width: linkRect.width };
    },
    []
  );

  const updateActiveIndicator = useCallback(() => {
    const activeLink = links.find((l) => isActive(l.href));
    if (!activeLink) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      setHasInitialized(false);
      return;
    }
    const measured = measureLink(activeLink.href);
    if (measured) {
      if (!hasInitialized) {
        setIndicator({ ...measured, opacity: 1 });
        setHasInitialized(true);
      } else {
        setIndicator({ ...measured, opacity: 1 });
      }
    }
  }, [isActive, measureLink, hasInitialized, links]);

  useEffect(() => {
    updateActiveIndicator();
  }, [pathname, updateActiveIndicator]);

  useEffect(() => {
    const handleResize = () => {
      updateActiveIndicator();
      setHoverIndicator((prev) => ({ ...prev, opacity: 0 }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateActiveIndicator]);

  useEffect(() => {
    if (user) {
      // Prefer Clerk's in-memory username for immediate UI updates.
      setUserName(user.username ?? null);
      fetch(`/api/users/${user.id}`)
        .then((res) => res.json())
        .then((data) => setUserName(data?.username ?? data?.name ?? user.username ?? null))
        .catch(() => {
          // Keep the current name if the profile fetch fails.
        });
    }
  }, [user]);

  useEffect(() => {
    if (user?.username) {
      setUserName(user.username);
    }
  }, [user?.username]);

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

  const userButtonAppearance = {
    elements: {
      userButtonTrigger:
        "rounded-md border border-gray-700 bg-gray-800/70 hover:bg-gray-700/80 transition-colors",
      userButtonAvatarBox: "h-8 w-8",
      userButtonPopoverCard: "bg-gray-900 border border-gray-700",
      userButtonPopoverActionButton:
        "text-gray-300 hover:text-white hover:bg-gray-800",
      userButtonPopoverActionButtonText: "text-gray-300",
      userButtonPopoverActionButtonIcon: "text-gray-400",
      userButtonPopoverFooter: "hidden",
    },
  };

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

        <nav
          ref={navRef}
          className="hidden lg:flex items-center gap-1 lg:justify-self-center relative"
          onMouseLeave={() => setHoverIndicator((prev) => ({ ...prev, opacity: 0 }))}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                if (el) linkRefs.current.set(link.href, el);
              }}
              onMouseEnter={() => {
                const measured = measureLink(link.href);
                if (measured) setHoverIndicator({ ...measured, opacity: 1 });
              }}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors relative z-10 ${
                isActive(link.href)
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div
            className="absolute bottom-0 h-[2px] bg-gray-500/40 rounded-full"
            style={{
              left: hoverIndicator.left,
              width: hoverIndicator.width,
              opacity: hoverIndicator.opacity,
              transition: hoverIndicator.opacity === 0
                ? "opacity 150ms ease"
                : "left 200ms ease, width 200ms ease, opacity 150ms ease",
            }}
          />
          <div
            className="absolute bottom-0 h-[2px] bg-white rounded-full"
            style={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.opacity,
              transition: hasInitialized
                ? "left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease"
                : "none",
            }}
          />
        </nav>

        <div className="hidden lg:flex items-center gap-3 lg:justify-self-end">
          {isSignedIn ? (
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
                <span className="text-[13px] font-medium text-gray-400">
                  {userName}
                </span>
              )}
              <UserButton afterSignOutUrl="/" appearance={userButtonAppearance} />
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
            {links.map((link) => (
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

            {isSignedIn ? (
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
                  <span className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-400 text-left">
                    {userName}
                  </span>
                )}
                <div className="px-3 py-2.5">
                  <UserButton afterSignOutUrl="/" appearance={userButtonAppearance} />
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

    </div>
  );
};

export default NavbarClient;
