import Link from "next/link";

const TEST_ROUTES = [
  { href: "/test/support-modal", label: "Support Modal Preview" },
  { href: "/test/loading", label: "Loading Screen Preview" },
  { href: "/test/draft", label: "Draft Flow Playground" },
  { href: "/test/draft-history", label: "Draft History Mock UI" },
  { href: "/test/draft-history/link-card", label: "Discord Link Card Preview" },
];

export default function TestRoutesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-10">
      <section className="mx-auto w-full max-w-3xl px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
          Test Routes
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Internal development previews and test utilities.
        </p>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {TEST_ROUTES.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-md border border-gray-800 bg-gray-900/70 px-3 py-2 text-left text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-gray-100"
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
