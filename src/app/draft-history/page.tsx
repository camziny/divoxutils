import { Suspense } from "react";
import DraftHistoryClient from "./DraftHistoryClient";

export const metadata = {
  title: "Draft History - divoxutils",
};

export const dynamic = "force-dynamic";

export default function DraftHistoryPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 py-8">
      <Suspense
        fallback={
          <section className="max-w-3xl mx-auto px-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
                Draft History
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                All completed drafts.
              </p>
            </div>
            <div className="rounded-md border border-gray-800 px-4 py-6 text-sm text-gray-500">
              Loading...
            </div>
          </section>
        }
      >
        <DraftHistoryClient />
      </Suspense>
    </div>
  );
}
