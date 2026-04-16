"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
