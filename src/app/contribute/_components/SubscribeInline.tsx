"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import SupporterBadge from "@/components/support/SupporterBadge";
import PaymentProviderToggle, {
  type PaymentProvider,
} from "@/components/support/PaymentProviderToggle";
import { SUPPORTER_TIER_PLANS } from "../_lib/supporterTierPlans";

type Props = {
  activeTier: number | null;
  paypalEnabled: boolean;
};

export default function SubscribeInline({ activeTier, paypalEnabled }: Props) {
  const { isSignedIn } = useAuth();
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = activeTier !== null;
  const activeProvider = paypalEnabled ? provider : "stripe";

  const startCheckout = async (tier: number) => {
    setError(null);
    setLoadingTier(tier);
    try {
      const endpoint =
        activeProvider === "paypal"
          ? "/api/billing/create-paypal-subscription"
          : "/api/billing/create-checkout-session";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Unable to start checkout.");
      }
      window.location.assign(payload.url);
    } catch (err) {
      const fallbackError =
        activeProvider === "paypal"
          ? "Unable to start PayPal checkout."
          : "Unable to start checkout.";
      setError(err instanceof Error ? err.message : fallbackError);
      setLoadingTier(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
        {isSubscribed ? "Your Plan" : "Choose a Tier"}
      </h2>

      {error && (
        <div className="rounded-md border border-red-900/60 bg-red-900/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!isSubscribed && isSignedIn && paypalEnabled && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Payment method
          </p>
          <PaymentProviderToggle
            value={provider}
            onChange={setProvider}
            disabled={loadingTier !== null}
          />
        </div>
      )}

      <div className="space-y-3">
        {SUPPORTER_TIER_PLANS.map((plan) => {
          const isCurrent = plan.tier === activeTier;
          return (
            <div
              key={plan.tier}
              className={`flex items-center gap-4 rounded-md border px-4 py-3 ${
                isCurrent
                  ? "border-indigo-500/30 bg-indigo-500/10"
                  : "border-gray-800 bg-gray-800/20"
              }`}
            >
              <SupporterBadge tier={plan.tier} size="md" showTooltip={false} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-white">{plan.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
              </div>
              {isSubscribed ? (
                isCurrent ? (
                  <span className="shrink-0 rounded-md bg-indigo-500/20 px-4 py-1.5 text-xs font-medium text-indigo-300">
                    Current
                  </span>
                ) : (
                  <Link
                    href="/billing"
                    className="shrink-0 rounded-md border border-gray-700 px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
                  >
                    Switch
                  </Link>
                )
              ) : isSignedIn ? (
                <button
                  type="button"
                  onClick={() => startCheckout(plan.tier)}
                  disabled={loadingTier !== null}
                  className="shrink-0 rounded-md bg-indigo-500/20 px-4 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                >
                  {loadingTier === plan.tier ? "Redirecting..." : "Subscribe"}
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="shrink-0 rounded-md border border-gray-700 px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center pt-1">
        Secure checkout powered by Stripe{paypalEnabled ? " and PayPal" : ""}. Already subscribed?{" "}
        <Link href="/billing" className="text-indigo-400 hover:text-indigo-300">
          Manage your subscription
        </Link>
      </p>
    </section>
  );
}
