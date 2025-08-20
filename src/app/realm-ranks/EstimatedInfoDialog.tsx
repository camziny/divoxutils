"use client";
import React from "react";

const EstimatedInfoDialog: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-indigo-300 hover:text-indigo-200 underline"
      >
        Learn more
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-[92%] sm:w-[520px] max-w-lg rounded-xl border border-gray-700/40 bg-gray-900/95 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              <h4 className="text-sm font-semibold text-gray-100 m-0">About Estimated Ranks</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 text-sm text-gray-200 space-y-2">
              <p>
                This is a best-guess projection based on a close look at the existing realm point values.
              </p>
              <p>
                The official realm rank data shows a clear exponential curve with a consistent growth factor of a 1.11 ratio for each rank.
              </p>
              <p>
                These projections are simply the result of extending that consistent pattern. 
              </p>
            </div>
            <div className="px-4 py-3 border-t border-gray-700/50 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimatedInfoDialog;


