import React from "react";

const LeaderboardListSkeleton = () => {
  return (
    <section className="max-w-3xl mx-auto px-6">
      <div className="mb-6 flex flex-col items-center">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="inline-flex">
            <div className="animate-pulse bg-gray-800 rounded-l-md h-8 w-16 border-r border-gray-700/50"></div>
            <div className="animate-pulse bg-gray-800 h-8 w-20 border-r border-gray-700/50"></div>
            <div className="animate-pulse bg-gray-800 rounded-r-md h-8 w-20"></div>
          </div>
          
          <div className="animate-pulse bg-gray-800 rounded-md h-8 w-[140px]"></div>
        </div>
      </div>

      <ol className="space-y-2">
        {Array.from({ length: 15 }).map((_, index) => (
          <li
            key={index}
            className="rounded-md border border-gray-800"
          >
            <div className="flex justify-between items-center w-full px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-800 rounded-md w-7 h-7"></div>
                <div className="animate-pulse bg-gray-800 rounded h-4 w-24"></div>
              </div>
              <div className="animate-pulse bg-gray-800 rounded h-4 w-16"></div>
            </div>
          </li>
        ))}
      </ol>
      
      <div className="my-8 flex justify-center">
        <div className="flex gap-1 overflow-visible h-10 rounded-md bg-gray-900 p-2 border border-gray-800">
          <div className="animate-pulse bg-gray-800 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-800 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-800 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-800 rounded-md w-10 h-8"></div>
          <div className="animate-pulse bg-gray-800 rounded-md w-10 h-8"></div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardListSkeleton;
