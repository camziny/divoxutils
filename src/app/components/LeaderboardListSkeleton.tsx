import React from "react";

const LeaderboardListSkeleton = () => {
  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-6 flex flex-col items-center">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex shadow-sm">
            <div className="animate-pulse bg-gray-700 rounded-l-lg h-10 w-16"></div>
            <div className="animate-pulse bg-gray-700 h-10 w-20 border-l border-gray-600"></div>
            <div className="animate-pulse bg-gray-700 rounded-r-lg h-10 w-20 border-l border-gray-600"></div>
          </div>
          
          <div className="animate-pulse bg-gray-700 rounded-lg h-10 w-[140px]"></div>
        </div>
      </div>

      <ol className="space-y-3">
        {Array.from({ length: 15 }).map((_, index) => (
          <li
            key={index}
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700/60 shadow-sm"
          >
            <div className="flex justify-between items-center w-full h-full p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-700 rounded-md w-8 h-8"></div>
                <div className="animate-pulse bg-gray-700 rounded h-6 w-24"></div>
              </div>
              <div className="animate-pulse bg-gray-700 rounded h-6 w-16"></div>
            </div>
          </li>
        ))}
      </ol>
      
      <div className="my-8 flex justify-center">
        <div className="flex gap-1 overflow-visible h-10 rounded-lg bg-gray-800/60 p-2 border border-gray-700/60">
          <div className="animate-pulse bg-gray-700 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-700 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-700 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-700 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-700 rounded-md w-10 h-8"></div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardListSkeleton; 