"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import SupporterBadge from "@/app/components/SupporterBadge";
import {
  appendTrackedCheckoutSessionId,
  hasTrackedCheckoutSessionId,
  isActiveSupportSubscriptionStatus,
  shouldTrackSupportSubscribeSuccess,
  TRACKED_CHECKOUT_SESSION_IDS_KEY,
} from "./supportSubscribeAnalytics";

type SubscriptionInfo = {
  tier: number;
  tierLabel: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
};

type BillingClientProps = {
  checkoutStatus: "success" | "cancel" | null;
  checkoutSessionId: string | null;
  subscription: SubscriptionInfo | null;
  isSignedIn: boolean;
};

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-gray-200" },
  trialing: { label: "Trial", color: "text-gray-200" },
  past_due: { label: "Past Due", color: "text-yellow-400" },
  canceled: { label: "Canceled", color: "text-gray-500" },
  incomplete: { label: "Incomplete", color: "text-yellow-400" },
  incomplete_expired: { label: "Expired", color: "text-red-400" },
  unpaid: { label: "Unpaid", color: "text-red-400" },
  none: { label: "—", color: "text-gray-600" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function readTrackedCheckoutSessionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRACKED_CHECKOUT_SESSION_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value) => typeof value === "string");
  } catch {
    return [];
  }
}

function writeTrackedCheckoutSessionIds(sessionIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRACKED_CHECKOUT_SESSION_IDS_KEY, JSON.stringify(sessionIds.slice(-50)));
  } catch {
    return;
  }
}

export default function BillingClient({
  checkoutStatus,
  checkoutSessionId,
  subscription,
  isSignedIn,
}: BillingClientProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedSubscribeSuccess = useRef(false);

  const isActive = isActiveSupportSubscriptionStatus(subscription?.status);

  const statusInfo = STATUS_DISPLAY[subscription?.status ?? "none"] ?? STATUS_DISPLAY.none;

  const statusMessage = useMemo(() => {
    if (checkoutStatus === "success") {
      return "Subscription setup complete. Your supporter badge will update shortly.";
    }
    if (checkoutStatus === "cancel") {
      return "Checkout was canceled. You can subscribe anytime from the Contribute page.";
    }
    return null;
  }, [checkoutStatus]);

  useEffect(() => {
    if (hasTrackedSubscribeSuccess.current) return;
    if (
      !shouldTrackSupportSubscribeSuccess({
        checkoutStatus,
        subscriptionStatus: subscription?.status,
      })
    ) {
      return;
    }
    if (checkoutSessionId) {
      const trackedSessionIds = readTrackedCheckoutSessionIds();
      if (hasTrackedCheckoutSessionId(checkoutSessionId, trackedSessionIds)) {
        hasTrackedSubscribeSuccess.current = true;
        return;
      }
      writeTrackedCheckoutSessionIds(appendTrackedCheckoutSessionId(trackedSessionIds, checkoutSessionId));
    }
    hasTrackedSubscribeSuccess.current = true;
    track("support_subscribe_success", {
      tier: subscription?.tier ?? null,
      subscription_status: subscription?.status ?? null,
      source: "billing_return",
    });
  }, [checkoutStatus, checkoutSessionId, subscription?.status, subscription?.tier]);

  const openBillingPortal = async () => {
    setError(null);
    setPortalLoading(true);
    try {
      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Unable to open billing portal.");
      }
      window.location.assign(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open billing portal.");
      setPortalLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-semibold text-white">Billing</h1>
        <p className="text-sm text-gray-400">
          Sign in to view your subscription and billing details.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-white tracking-tight">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription and payment details.
        </p>
      </header>

      {statusMessage && (
        <div
          className={`rounded-md border px-4 py-2.5 text-sm ${
            checkoutStatus === "success"
              ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
              : "border-yellow-900/60 bg-yellow-900/20 text-yellow-300"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-900/60 bg-red-900/20 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-800/20 divide-y divide-gray-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Current Plan
          </div>
          <div className="flex items-center gap-2">
            {isActive && subscription && subscription.tier > 0 && (
              <SupporterBadge tier={subscription.tier} size="sm" showTooltip={false} />
            )}
            <span className="text-sm font-medium text-white">
              {isActive ? subscription?.tierLabel : "None"}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </div>
          {subscription?.cancelAtPeriodEnd && isActive ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70 shrink-0" />
              <span className="text-gray-400 font-medium">Cancels at period end</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm">
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-500/70 shrink-0" />
              )}
              <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </span>
          )}
        </div>

        {isActive && subscription?.currentPeriodEnd && (
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {subscription.cancelAtPeriodEnd ? "Access Until" : "Next Billing"}
            </div>
            <span className="text-sm text-gray-300">
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}
      </div>

      {isActive && subscription?.hasStripeCustomer ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="w-full rounded-md bg-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
          >
            {portalLoading ? "Opening..." : "Manage Subscription"}
          </button>
          <p className="text-xs text-gray-600 text-center">
            {subscription.cancelAtPeriodEnd
              ? "No further charges — you can resubscribe any time."
              : "Update payment method, switch plans, or cancel."}
          </p>
        </div>
      ) : subscription?.hasStripeCustomer && !isActive ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 text-center">
            Your subscription is no longer active. You can resubscribe anytime.
          </p>
          <div className="flex gap-3">
            <Link
              href="/contribute"
              className="flex-1 text-center rounded-md bg-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
            >
              Resubscribe
            </Link>
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="flex-1 rounded-md border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {portalLoading ? "Opening..." : "Billing History"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-400">
            You don&apos;t have an active subscription yet.
          </p>
          <Link
            href="/contribute"
            className="inline-flex rounded-md bg-indigo-500/20 px-6 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          >
            Choose a Plan
          </Link>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center">
        Payment processing by Stripe. Card details are never stored by divoxutils.
      </p>
    </div>
  );
}
