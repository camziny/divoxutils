"use client";
import Link from "next/link";
import { useState, useCallback } from "react";

interface TouchPrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  touchDelay?: number;
}

export function TouchPrefetchLink({
  href,
  children,
  className,
  touchDelay = 200,
}: TouchPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(() => {
    const timeout = setTimeout(() => {
      setShouldPrefetch(true);
    }, touchDelay);
    setTouchTimeout(timeout);
  }, [touchDelay]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  }, [touchTimeout]);

  const handleTouchMove = useCallback(() => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  }, [touchTimeout]);

  return (
    <Link
      href={href}
      prefetch={shouldPrefetch ? undefined : false}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseEnter={() => setShouldPrefetch(true)}
      className={className}
    >
      {children}
    </Link>
  );
} 