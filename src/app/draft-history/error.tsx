"use client";

export default function DraftHistoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-800 px-4 py-8 text-center">
      <p className="text-sm text-red-400 mb-4">
        Something went wrong loading this page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
