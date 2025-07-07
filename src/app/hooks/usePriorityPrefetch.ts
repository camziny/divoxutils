"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PrefetchRoute {
  href: string;
  priority: "high" | "medium" | "low";
}

export function usePriorityPrefetch(routes: PrefetchRoute[]) {
  const router = useRouter();

  useEffect(() => {
    const sortedRoutes = routes.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const timeouts: NodeJS.Timeout[] = [];

    sortedRoutes.forEach((route, index) => {
      let delay: number;
      switch (route.priority) {
        case "high":
          delay = 100 + index * 50;
          break;
        case "medium":
          delay = 1000 + index * 100;
          break;
        case "low":
          delay = 3000 + index * 200;
          break;
      }

      const timeout = setTimeout(() => {
        router.prefetch(route.href);
      }, delay);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [routes, router]);
} 