"use client";
import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-20 w-20 mb-4"></div>
      <p className="text-lg font-semibold">Loading...</p>
      <style jsx>{`
        .loader {
          border-top-color: #667eea; /* Indigo-500 */
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

        /* Centering the loader more accurately */
        .flex {
          height: calc(100vh - 20vh); /* Adjust the 20vh as needed */
          margin-top: -10vh; /* Half of the adjusted value */
        }
      `}</style>
    </div>
  );
}
