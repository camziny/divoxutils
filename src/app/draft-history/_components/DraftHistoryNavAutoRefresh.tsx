"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 30000;

export default function DraftHistoryNavAutoRefresh() {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const refreshIfNeeded = () => {
      if (
        pathname.startsWith("/draft-history/live") ||
        document.visibilityState !== "visible"
      ) {
        return;
      }
      router.refresh();
    };

    const intervalId = setInterval(refreshIfNeeded, REFRESH_INTERVAL_MS);
    const onVisibilityChange = () => {
      refreshIfNeeded();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
