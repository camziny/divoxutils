"use client";
import React from "react";

export default function Loading() {
  return (
    <div
      className="flex flex-col justify-start items-center min-h-screen bg-gray-900 text-white"
      style={{ paddingTop: "10vh" }}
    >
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-20 w-20 mb-4"></div>
      <p className="text-lg font-semibold">Loading...</p>
      <style jsx>{`
        .loader {
          border-top-color: #667eea;
          animation: spinner 1s linear infinite;
        }

        @keyframes spinner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
