import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - divoxutils",
};

const LAST_UPDATED = "March 27, 2026";

export default function TermsPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-6">
          <p className="text-sm leading-relaxed text-gray-400">
            By using divoxutils you agree to these terms. If you do not agree, do not use
            the service.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            You are responsible for activity on your account and for maintaining the security
            of your login credentials. Do not misuse the service, attempt unauthorized access,
            or interfere with app operation.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            Optional monthly supporter subscriptions are billed through Stripe and renew
            automatically unless canceled. You can manage cancellation, plan changes, and
            payment methods from your Billing page at any time.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            We aim to keep the service available, but uptime is not guaranteed. Features may
            change, be updated, or be removed over time.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            For questions about these terms, contact{" "}
            <a
              href="mailto:support@divoxutils.com"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              support@divoxutils.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
