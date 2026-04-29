"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const HAD_SESSION_KEY = "du_had_session";
const DISMISSED_UNTIL_KEY = "du_signed_out_nudge_dismissed_until";
const DISMISS_MS = 24 * 60 * 60 * 1000;

const isAuthPage = (pathname: string | null) =>
  pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

type SignedOutNudgeProps = {
  hasSupporterDeviceGrace?: boolean;
};

export default function SignedOutNudge({
  hasSupporterDeviceGrace = false,
}: SignedOutNudgeProps) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isSignedIn === undefined) {
      setVisible(false);
      return;
    }

    if (isSignedIn) {
      window.localStorage.setItem(HAD_SESSION_KEY, "1");
      setVisible(false);
      return;
    }

    if (isAuthPage(pathname)) {
      setVisible(false);
      return;
    }

    const hadSession = window.localStorage.getItem(HAD_SESSION_KEY) === "1";
    const dismissedUntilRaw = window.localStorage.getItem(DISMISSED_UNTIL_KEY);
    const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
    const now = Date.now();
    const canShowForDevice = hasSupporterDeviceGrace || hadSession || isLocalhost;

    if (
      !canShowForDevice ||
      Number.isNaN(dismissedUntil) ||
      (!isLocalhost && now < dismissedUntil)
    ) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [isSignedIn, pathname, hasSupporterDeviceGrace]);

  const signInHref = useMemo(() => {
    const redirect = pathname || "/";
    return `/sign-in?redirect_url=${encodeURIComponent(redirect)}`;
  }, [pathname]);

  const dismiss = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_MS));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-5 sm:w-auto sm:translate-x-0">
      <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-4 pr-2 shadow-xl">
        <p className="min-w-0 text-[13px] leading-snug text-gray-300">
          Signed out &mdash; sign in to keep your preferences and account status active
        </p>
        <Link
          href={signInHref}
          className="shrink-0 rounded-md bg-indigo-500/20 px-3 py-1 text-[12px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-gray-500 transition-colors hover:text-gray-300"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
