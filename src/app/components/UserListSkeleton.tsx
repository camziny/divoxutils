import React from "react";

const UserListSkeleton = () => {
  return (
    <div className="w-full mt-8 px-2 relative">
      <div className="sticky top-10 left-0 z-10 bg-gray-900 py-2">
        <div className="flex justify-center mb-4 overflow-x-auto">
          {Array.from({ length: 15 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-gray-700 rounded h-4 w-8 mx-1"
            ></div>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto w-full">
        {Array.from({ length: 3 }).map((_, groupIdx) => (
          <div key={groupIdx} className="mb-4">
            <h3 className="animate-pulse bg-gray-700 rounded h-6 w-16 font-bold text-xl text-white mb-2"></h3>
            <ul className="divide-y divide-gray-700">
              {Array.from({ length: 3 }).map((_, userIndex) => (
                <li
                  key={userIndex}
                  className="animate-pulse bg-gray-700 rounded h-10 p-2 bg-gray-800"
                ></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserListSkeleton;
