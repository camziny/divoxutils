import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - divoxutils",
};

const LAST_UPDATED = "March 27, 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-6">
          <p className="text-sm leading-relaxed text-gray-400">
            divoxutils collects limited data needed to run accounts, process optional
            subscriptions, and keep the service running. We do not run advertising or
            sell your data.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            Account authentication is handled by Clerk. When you sign in, Clerk may store
            account identifiers and profile information you provide. Subscription payments are
            processed by Stripe. We store subscription status and related metadata to manage
            your supporter badge and billing history. Card details are never stored by
            divoxutils.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            We use this data only to provide app features, manage your account, send
            transactional emails (such as subscription confirmations), and keep the service
            available. We do not run advertising trackers. Cookies are used only where
            necessary for authentication and core functionality.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            Data is shared only with the service providers required to operate the app:
            authentication, payments, hosting, database, and email providers.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            For privacy questions, contact{" "}
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
