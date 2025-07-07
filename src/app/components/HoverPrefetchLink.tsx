"use client";
import Link from "next/link";
import { useState, useCallback } from "react";

interface HoverPrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchDelay?: number;
}

export function HoverPrefetchLink({
  href,
  children,
  className,
  prefetchDelay = 100,
}: HoverPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    const timeout = setTimeout(() => {
      setShouldPrefetch(true);
    }, prefetchDelay);
    setHoverTimeout(timeout);
  }, [prefetchDelay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }, [hoverTimeout]);

  return (
    <Link
      href={href}
      prefetch={shouldPrefetch ? undefined : false}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </Link>
  );
} 