"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  total: number;
  page: number;
  onChange: (page: number) => void;
  siblings?: number;
}

function getVisiblePages(current: number, total: number, siblings: number) {
  const pages: (number | "ellipsis")[] = [];

  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);

  pages.push(1);

  if (left > 2) {
    pages.push("ellipsis");
  }

  for (let i = left; i <= right; i++) {
    pages.push(i);
  }

  if (right < total - 1) {
    pages.push("ellipsis");
  }

  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

const Pagination: React.FC<PaginationProps> = ({
  total,
  page,
  onChange,
  siblings = 1,
}) => {
  if (total <= 1) return null;

  const pages = getVisiblePages(page, total, siblings);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors",
          page <= 1
            ? "text-gray-600 cursor-not-allowed"
            : "text-gray-400 hover:bg-gray-800 hover:text-indigo-400"
        )}
        aria-label="Previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center w-8 h-8 text-xs text-gray-600 select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium tabular-nums transition-colors",
              p === page
                ? "bg-indigo-500/20 text-indigo-300"
                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            )}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors",
          page >= total
            ? "text-gray-600 cursor-not-allowed"
            : "text-gray-400 hover:bg-gray-800 hover:text-indigo-400"
        )}
        aria-label="Next page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
};

export { Pagination };
