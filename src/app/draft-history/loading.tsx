export default function DraftHistoryLoading() {
  return (
    <>
      <div className="mb-6">
        <div className="h-6 w-32 rounded bg-gray-800 animate-pulse" />
        <div className="mt-2 h-4 w-40 rounded bg-gray-800 animate-pulse" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-800 px-4 py-3.5 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 rounded bg-gray-800" />
              <div className="h-3 w-24 rounded bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
