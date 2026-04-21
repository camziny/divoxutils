"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import SupporterBadge from "@/components/support/SupporterBadge";
import {
  appendTrackedCheckoutSessionId,
  hasTrackedCheckoutSessionId,
  isActiveSupportSubscriptionStatus,
  isSameSupportPlan,
  shouldTrackSupportSubscribeSuccess,
  TRACKED_CHECKOUT_SESSION_IDS_KEY,
} from "../_lib/supportSubscribeAnalytics";
import { SUPPORTER_TIER_PLANS } from "@/app/contribute/_lib/supporterTierPlans";

type SubscriptionInfo = {
  provider: "stripe" | "paypal" | null;
  tier: number;
  tierLabel: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  hasPayPalSubscription: boolean;
  pendingTier: number | null;
  pendingTierLabel: string | null;
};

type BillingClientProps = {
  checkoutStatus: "success" | "cancel" | null;
  switchStatus: "scheduled" | "cancel" | null;
  checkoutSessionId: string | null;
  subscription: SubscriptionInfo | null;
  isSignedIn: boolean;
};

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-green-400" },
  trialing: { label: "Trial", color: "text-green-400" },
  past_due: { label: "Past Due", color: "text-gray-300" },
  canceled: { label: "Canceled", color: "text-yellow-400" },
  incomplete: { label: "Incomplete", color: "text-gray-300" },
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

function isFutureDate(iso: string | null): boolean {
  if (!iso) return false;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() > Date.now();
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
  switchStatus,
  checkoutSessionId,
  subscription,
  isSignedIn,
}: BillingClientProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [paypalCancelLoading, setPaypalCancelLoading] = useState(false);
  const [paypalSwitchLoadingTier, setPaypalSwitchLoadingTier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedSubscribeSuccess = useRef(false);

  const isActive = isActiveSupportSubscriptionStatus(subscription?.status);
  const hasGraceAccess =
    Boolean(subscription?.cancelAtPeriodEnd) && isFutureDate(subscription?.currentPeriodEnd ?? null);
  const hasManageablePayPalSubscription =
    subscription?.provider === "paypal" &&
    subscription?.hasPayPalSubscription &&
    (isActive || hasGraceAccess);
  const showsAccessUntilState = isActive || hasGraceAccess;
  const shouldShowSyncHint = checkoutStatus === "success" || switchStatus === "scheduled";
  const syncRefreshKey = useMemo(() => {
    if (checkoutStatus === "success") {
      return `billing-sync-checkout-${checkoutSessionId ?? "unknown"}`;
    }
    if (switchStatus === "scheduled") {
      return "billing-sync-switch-scheduled";
    }
    return null;
  }, [checkoutStatus, checkoutSessionId, switchStatus]);

  const statusInfo = STATUS_DISPLAY[subscription?.status ?? "none"] ?? STATUS_DISPLAY.none;

  const statusMessage = useMemo(() => {
    if (checkoutStatus === "success") {
      return "Subscription setup complete. Your supporter badge will update shortly.";
    }
    if (checkoutStatus === "cancel") {
      return "Checkout was canceled. You can subscribe anytime from the Contribute page.";
    }
    if (switchStatus === "scheduled") {
      return "Your plan change is scheduled for the next billing cycle.";
    }
    if (switchStatus === "cancel") {
      return "Plan change approval was canceled. Your current tier stays the same.";
    }
    return null;
  }, [checkoutStatus, switchStatus]);
  const isSuccessStatusMessage =
    checkoutStatus === "success" || switchStatus === "scheduled";

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
    } else {
      if (typeof window !== "undefined") {
        const fallbackTrackedKey = "divoxutils_billing_success_no_session_tracked_v1";
        try {
          if (window.sessionStorage.getItem(fallbackTrackedKey) === "1") {
            hasTrackedSubscribeSuccess.current = true;
            return;
          }
          window.sessionStorage.setItem(fallbackTrackedKey, "1");
        } catch {
        }
      }
    }
    hasTrackedSubscribeSuccess.current = true;
    track("support_subscribe_success", {
      tier: subscription?.tier ?? null,
      subscription_status: subscription?.status ?? null,
      source: "billing_return",
    });
  }, [checkoutStatus, checkoutSessionId, subscription?.status, subscription?.tier]);

  useEffect(() => {
    if (!syncRefreshKey) return;
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(syncRefreshKey) === "1") return;
      window.sessionStorage.setItem(syncRefreshKey, "1");
    } catch {
      return;
    }
    const timeout = window.setTimeout(() => {
      window.location.reload();
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [syncRefreshKey]);

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

  const cancelPayPal = async () => {
    setError(null);
    setPaypalCancelLoading(true);
    try {
      const response = await fetch("/api/billing/cancel-paypal-subscription", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to cancel PayPal subscription.");
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel PayPal subscription.");
      setPaypalCancelLoading(false);
    }
  };

  const schedulePayPalPlanChange = async (tier: number) => {
    setError(null);
    setPaypalSwitchLoadingTier(tier);
    try {
      const response = await fetch("/api/billing/change-paypal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Unable to schedule PayPal plan change.");
      }
      window.location.assign(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to schedule PayPal plan change.");
      setPaypalSwitchLoadingTier(null);
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
            isSuccessStatusMessage
              ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
              : "border-gray-700 bg-gray-800/40 text-gray-300"
          }`}
        >
          {statusMessage}
          {shouldShowSyncHint && (
            <p className="mt-1 text-xs text-gray-300">
              Billing updates can take up to a minute to appear.
            </p>
          )}
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
            Provider
          </div>
          <span className="text-sm font-medium text-gray-300">
            {subscription?.provider === "paypal"
              ? "PayPal"
              : subscription?.provider === "stripe"
                ? "Stripe"
                : "—"}
          </span>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </div>
          {subscription?.cancelAtPeriodEnd && showsAccessUntilState ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70 shrink-0" />
              <span className="text-yellow-300 font-medium">Cancels at period end</span>
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

        {showsAccessUntilState && subscription?.currentPeriodEnd && (
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

      {subscription?.provider === "stripe" && isActive && subscription?.hasStripeCustomer ? (
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
      ) : hasManageablePayPalSubscription ? (
        <div className="space-y-4">
          {isActive && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Switch Plan
                </h2>
                <span className="text-[11px] text-gray-600">
                  Effective next billing cycle
                </span>
              </div>
              <div className="space-y-2">
                {SUPPORTER_TIER_PLANS.map((plan) => {
                  const isCurrent = isSameSupportPlan(subscription.tier, plan.tier);
                  const isPending = isSameSupportPlan(subscription.pendingTier, plan.tier);
                  const isLoading = paypalSwitchLoadingTier === plan.tier;
                  return (
                    <div
                      key={plan.tier}
                      className={`flex items-center gap-3 rounded-md border px-4 py-2.5 ${
                        isCurrent
                          ? "border-indigo-500/30 bg-indigo-500/10"
                          : isPending
                            ? "border-gray-700 bg-gray-800/35"
                            : "border-gray-800 bg-gray-800/20"
                      }`}
                    >
                      <SupporterBadge tier={plan.tier} size="sm" showTooltip={false} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-white">
                          {plan.label}
                        </span>
                      </div>
                      {isCurrent ? (
                        <span className="shrink-0 rounded-md bg-indigo-500/20 px-3 py-1 text-[11px] font-medium text-indigo-300">
                          Current
                        </span>
                      ) : isPending ? (
                        <span className="shrink-0 rounded-md bg-gray-700/70 px-3 py-1 text-[11px] font-medium text-gray-200">
                          Scheduled
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => schedulePayPalPlanChange(plan.tier)}
                          disabled={paypalSwitchLoadingTier !== null || paypalCancelLoading}
                          className="shrink-0 rounded-md border border-gray-700 px-3 py-1 text-[11px] font-medium text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? "Scheduling..." : "Switch"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {subscription.pendingTierLabel && subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-300">
                  Switching to {subscription.pendingTierLabel} on{" "}
                  {formatDate(subscription.currentPeriodEnd)}.
                </p>
              )}
            </section>
          )}

          <section className="rounded-md border border-gray-800 bg-gray-800/20 p-3 space-y-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Subscription Management
            </h3>
            <p className="text-[11px] text-gray-400">
              You can manage this subscription in your PayPal account at any time.
            </p>
            {!subscription.cancelAtPeriodEnd && (
              <button
                type="button"
                onClick={cancelPayPal}
                disabled={paypalCancelLoading || paypalSwitchLoadingTier !== null}
                className="w-full rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-400 hover:border-red-900/60 transition-colors disabled:opacity-50"
              >
                {paypalCancelLoading ? "Cancelling..." : "Cancel at period end"}
              </button>
            )}
            {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
              <p className="text-[11px] text-yellow-300/90">
                Your access remains active until {formatDate(subscription.currentPeriodEnd)}.
              </p>
            )}
          </section>
        </div>
      ) : subscription?.provider === "stripe" && subscription?.hasStripeCustomer && !isActive ? (
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

    </div>
  );
}
