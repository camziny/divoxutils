import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support - divoxutils",
  description:
    "Get help with divoxutils account, billing, and support questions.",
  alternates: {
    canonical: "https://divoxutils.com/support",
  },
  openGraph: {
    title: "Support - divoxutils",
    description: "Get help with divoxutils account, billing, and support questions.",
    url: "https://divoxutils.com/support",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support - divoxutils",
    description: "Get help with divoxutils account, billing, and support questions.",
    images: ["/wh-big.png"],
  },
};

export default function SupportPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Support</h1>
        </header>

        <section className="space-y-6">
          <p className="text-sm leading-relaxed text-gray-400">
            For account issues, billing questions, or anything else, reach out by email and
            we will get back to you within a few business days.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            Email:{" "}
            <a
              href="mailto:support@divoxutils.com"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              support@divoxutils.com
            </a>
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            For subscription management, you can cancel, switch plans, or update your payment
            method directly from the{" "}
            <a href="/billing" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Billing page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
