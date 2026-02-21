import DraftHistoryNav from "./DraftHistoryNav";

export default function DraftHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 py-8">
      <section className="max-w-3xl mx-auto px-6">
        <DraftHistoryNav />
        {children}
      </section>
    </div>
  );
}
