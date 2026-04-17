import React from "react";

const MobileCharacterTileSkeleton = () => {
  return (
    <div className="mb-1 mx-3">
      <div className="relative overflow-hidden rounded-lg shadow-sm bg-gray-800 animate-pulse">
        <div className="bg-gradient-to-r from-gray-900/95 to-gray-900/90 backdrop-blur-sm">
          <div className="flex items-center px-3 py-1.5">
            {/* Expand Button Skeleton */}
            <div className="mr-2">
              <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
            </div>
            
            {/* Character Info Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="h-4 bg-gray-700 rounded w-28 mb-0.5"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="h-4 bg-gray-700 rounded w-14 mb-0.5"></div>
                    <div className="h-3 bg-gray-700 rounded w-10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileCharacterTileSkeleton;
