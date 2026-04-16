"use client";
import React, { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";

export default function CharacterSearchAndAddTooltip() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors duration-150"
        aria-label="Open character add info"
        aria-expanded={isOpen}
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-800 bg-gray-900 shadow-xl z-[120]"
          role="dialog"
          aria-label="Character add info"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <h3 className="text-xs font-medium text-gray-300">Info</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors duration-150"
              aria-label="Close character add info"
            >
              <X size={13} />
            </button>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-xs text-gray-400 leading-relaxed">
              If you attempt to add a character that&apos;s already in your
              list, we&apos;ll recognize it and prevent duplication.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
