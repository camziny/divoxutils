"use client";
import React, { useState } from "react";
import { Info, X } from "lucide-react";

export default function CharacterSearchAndAddTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors duration-150"
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-200">Info</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors duration-150"
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-gray-400 leading-relaxed">
                If you attempt to add a character that&apos;s already in your
                list, we&apos;ll recognize it and prevent duplication. No need
                to worry about duplicates!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
