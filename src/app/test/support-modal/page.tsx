import { notFound } from "next/navigation";
import SupportPromptModal from "@/components/support/SupportPromptModal";
import { isPayPalSubscriptionsEnabled } from "@/server/billing/paypal";

export default function SupportModalTestPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  const paypalEnabled = isPayPalSubscriptionsEnabled();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Support Modal Test</h1>
          <p className="text-sm text-gray-400">
            Development-only preview for cadence and modal behavior.
          </p>
        </header>
        <SupportPromptModal debug ignorePathRules paypalEnabled={paypalEnabled} />
      </div>
    </div>
  );
}
