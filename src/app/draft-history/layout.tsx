import DraftHistoryNav from "./DraftHistoryNav";
import { getLiveDraftCount } from "@/server/draftLive";
import DraftHistoryNavAutoRefresh from "./DraftHistoryNavAutoRefresh";

export const revalidate = 30;

export default async function DraftHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const liveDraftCount = await getLiveDraftCount();

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 py-8">
      <section className="max-w-3xl mx-auto px-6">
        <DraftHistoryNavAutoRefresh />
        <DraftHistoryNav liveDraftCount={liveDraftCount} />
        {children}
      </section>
    </div>
  );
}
