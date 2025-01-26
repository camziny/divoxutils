"use client";
import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col justify-start items-center min-h-screen bg-gray-900 text-white" style={{ paddingTop: "20vh" }}>
      <div className="relative">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
          
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          
          <div className="absolute inset-3 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-lg font-semibold text-gray-400 bg-clip-text ">
            Loading
            <span className="inline-flex ml-1">
              <span className="animate-bounce text-gray-400 delay-0">.</span>
              <span className="animate-bounce text-gray-400 delay-100">.</span>
              <span className="animate-bounce text-gray-400 delay-200">.</span>
            </span>
          </p>
        </div>
      </div>

      <style jsx>{`
        .delay-0 {
          animation-delay: 0ms;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          50% {
            opacity: .5;
          }
        }
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: translateY(0);
          }
          40% { 
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
