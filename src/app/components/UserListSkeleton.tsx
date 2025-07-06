import React from "react";

const UserListSkeleton = () => {
  return (
    <div className="w-full">
      <div className="hidden sm:block sticky top-20 z-30 bg-gray-900/98 backdrop-blur-sm -mx-2 px-2 shadow-lg">
        <div className="container mx-auto py-1.5 px-2 sm:px-4">
          <div className="flex flex-wrap sm:flex-nowrap justify-center gap-0.5 sm:gap-1 max-w-none">
            {Array.from({ length: 15 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse bg-gray-700 rounded 
                  px-1 sm:px-1.5 md:px-2 py-0.5 
                  min-w-[20px] sm:min-w-[24px] md:min-w-[28px] 
                  h-6 flex-shrink-0"
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 mt-4 sm:mt-6">
        {Array.from({ length: 7 }).map((_, groupIdx) => (
          <div key={groupIdx} className="mb-6">
            <div className="animate-pulse bg-gray-700 rounded h-6 w-16 font-bold text-xl text-white mb-3"></div>
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, userIndex) => (
                <div
                  key={userIndex}
                  className="animate-pulse bg-gray-700 rounded h-10 p-2"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserListSkeleton;
