"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarFallbackVariant = "icon" | "initial";

export interface AvatarProps {
  /** Raw value from a Convex field (avatarUrl / createdByAvatarUrl /
   *  substituteAvatarUrl). Missing, empty, and load-failure all render the
   *  same fallback — callers never need to branch on which case they're in. */
  src?: string | null;
  /** Alt text, and the source letter when fallback === "initial". */
  name?: string;
  /** Square edge length in px. This is the one layout-affecting prop; the
   *  fallback renders at the identical box size so swapping never reflows. */
  size: number;
  /** Which placeholder renders when there's nothing to show. */
  fallback?: AvatarFallbackVariant;
  /** 1px ring, matching the admin/leaderboard chip look. */
  bordered?: boolean;
}

export function Avatar({
  src,
  name,
  size,
  fallback = "icon",
  bordered = false,
}: AvatarProps) {
  // erroredSrc holds the last src that failed to load. Comparing against the
  // *current* src (not a boolean) means a recycled instance (e.g. a list row
  // reused for a different player) self-heals the moment it's handed a
  // different, good url, without needing a remount or a key prop.
  const [erroredSrc, setErroredSrc] = useState<string | undefined>(undefined);

  const showFallback = !src || src === erroredSrc;

  if (showFallback) {
    return (
      <AvatarFallbackBox
        name={name}
        size={size}
        variant={fallback}
        bordered={bordered}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={name ?? "Avatar"}
      width={size}
      height={size}
      unoptimized
      className={cn(
        "rounded-full object-cover shrink-0",
        bordered && "border border-gray-700"
      )}
      onError={() => setErroredSrc(src)}
    />
  );
}

function AvatarFallbackBox({
  name,
  size,
  variant,
  bordered,
}: {
  name: string | undefined;
  size: number;
  variant: AvatarFallbackVariant;
  bordered: boolean;
}) {
  const style = { width: size, height: size };
  const shell = cn(
    "rounded-full shrink-0 inline-flex items-center justify-center bg-gray-800 text-gray-400",
    bordered && "border border-gray-700"
  );

  if (variant === "initial") {
    const initial = name?.trim().charAt(0).toUpperCase() || "?";
    return (
      <span className={shell} style={style}>
        <span style={{ fontSize: Math.max(8, Math.floor(size * 0.55)) }}>
          {initial}
        </span>
      </span>
    );
  }

  return (
    <span className={shell} style={style}>
      <User size={Math.max(10, Math.floor(size * 0.6))} />
    </span>
  );
}
