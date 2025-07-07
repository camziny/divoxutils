"use client";
import { usePriorityPrefetch } from "@/app/hooks/usePriorityPrefetch";

export function NavigationPrefetch() {
  usePriorityPrefetch([
    { href: "/leaderboards", priority: "high" },
    { href: "/user-characters", priority: "high" },
    { href: "/search", priority: "medium" },
    { href: "/about", priority: "low" },
    { href: "/help", priority: "low" },
  ]);

  return null;
} 