import React from "react";

const UserListSkeleton = () => {
  return (
    <div className="w-full">
      <div className="hidden sm:block sticky top-20 z-30 bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto py-1.5 px-2 sm:px-4">
          <div className="flex flex-wrap sm:flex-nowrap justify-center gap-0.5 sm:gap-0 max-w-none">
            {Array.from({ length: 15 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse bg-gray-800 rounded-md 
                  px-1.5 sm:px-2 md:px-2.5 py-0.5 
                  min-w-[22px] sm:min-w-[26px] md:min-w-[30px] 
                  h-5 flex-shrink-0"
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-4 mt-4 sm:mt-6 max-w-3xl mx-auto">
        {Array.from({ length: 7 }).map((_, groupIdx) => (
          <div key={groupIdx} className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-pulse bg-gray-800 rounded h-4 w-6"></div>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="divide-y divide-gray-800/50">
              {Array.from({ length: 3 }).map((_, userIndex) => (
                <div
                  key={userIndex}
                  className="animate-pulse py-1.5 px-3"
                >
                  <div className="bg-gray-800 rounded h-4 w-32"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserListSkeleton;
