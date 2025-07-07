"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface ViewportPrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function ViewportPrefetchLink({
  href,
  children,
  className,
  threshold = 0.1,
  rootMargin = "50px",
}: ViewportPrefetchLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenSeen) {
            setIsInViewport(true);
            setHasBeenSeen(true);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (linkRef.current) {
      observer.observe(linkRef.current);
    }

    return () => {
      if (linkRef.current) {
        observer.unobserve(linkRef.current);
      }
    };
  }, [threshold, rootMargin, hasBeenSeen]);

  return (
    <Link
      ref={linkRef}
      href={href}
      prefetch={isInViewport}
      className={className}
    >
      {children}
    </Link>
  );
} 