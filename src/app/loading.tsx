"use client";
import React from "react";

export default function Loading() {
  return (
    <div
      className="flex items-start justify-center min-h-screen bg-gray-900"
      style={{ paddingTop: "20vh" }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin-slow"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#1f2937"
            strokeWidth="2.5"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="url(#spinner-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spinner-gradient" x1="12" y1="2" x2="22" y2="12">
              <stop stopColor="#818cf8" />
              <stop offset="1" stopColor="#6366f1" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
        <p className="text-[13px] text-gray-500">Loading</p>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 0.9s linear infinite;
        }
      `}</style>
    </div>
  );
}
