export default function LeaderboardLoading() {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="h-6 w-32 rounded bg-gray-800 animate-pulse" />
          <div className="mt-2 h-4 w-28 rounded bg-gray-800 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-12 rounded bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-gray-800 divide-y divide-gray-800/60">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-6 h-4 rounded bg-gray-800" />
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <div className="h-4 rounded bg-gray-800 w-28" />
                  <div className="h-3 rounded bg-gray-800 w-20" />
                </div>
                <div className="h-1 rounded-full bg-gray-800" />
              </div>
              <div className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
