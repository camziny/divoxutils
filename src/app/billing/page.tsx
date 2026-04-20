import React from "react";
import { auth } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import prisma from "../../../prisma/prismaClient";
import {
  isPayPalSubscriptionsEnabled,
  fetchPayPalSubscription,
  getPayPalPlanMap,
} from "@/server/billing/paypal";
import {
  getStripeClient,
  getStripePriceMap,
  getTierFromPriceId,
  shouldGrantSupporterBadge,
} from "@/server/billing/stripe";
import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";
import BillingClient from "./_components/BillingClient";

export const metadata = {
  title: "Billing - divoxutils",
};

type BillingPageProps = {
  searchParams?: {
    checkout?: "success" | "cancel";
    switch?: "scheduled" | "cancel";
    session_id?: string;
  };
};

const TIER_LABELS: Record<number, string> = {
  1: "$1 / month",
  2: "$3 / month",
  3: "$5 / month",
};

const resolveRemotePeriodSeconds = (
  subscription: Stripe.Subscription
): number | null => {
  const typedSubscription = subscription as unknown as { current_period_end?: number | null };
  const subscriptionLevel = typedSubscription.current_period_end;
  if (typeof subscriptionLevel === "number" && Number.isFinite(subscriptionLevel)) {
    return subscriptionLevel;
  }
  const itemLevel = subscription.items.data[0]?.current_period_end;
  if (typeof itemLevel === "number" && Number.isFinite(itemLevel)) {
    return itemLevel;
  }
  return null;
};

const BillingPage = async ({ searchParams }: BillingPageProps) => {
  const checkoutStatus =
    searchParams?.checkout === "success" || searchParams?.checkout === "cancel"
      ? searchParams.checkout
      : null;
  const checkoutSessionId =
    typeof searchParams?.session_id === "string" && searchParams.session_id.length > 0
      ? searchParams.session_id
      : null;
  const switchStatus =
    searchParams?.switch === "scheduled" || searchParams?.switch === "cancel"
      ? searchParams.switch
      : null;

  const paypalEnabled = isPayPalSubscriptionsEnabled();

  let subscription: {
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
  } | null = null;
  let isSignedIn = false;

  try {
    const { userId } = await auth();
    isSignedIn = Boolean(userId);
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: {
          supporterTier: true,
          subscriptionStatus: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
          subscriptionPriceId: true,
          pendingSubscriptionPriceId: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          subscriptionProvider: true,
          paypalSubscriptionId: true,
          paypalPayerId: true,
        },
      });

      if (user) {
        let resolvedStatus = user.subscriptionStatus ?? "none";
        let resolvedPriceId = user.subscriptionPriceId ?? null;
        let resolvedPendingPriceId = user.pendingSubscriptionPriceId ?? null;
        let resolvedCancelAtPeriodEnd = user.subscriptionCancelAtPeriodEnd;
        let resolvedPeriodEnd = user.subscriptionCurrentPeriodEnd;
        const provider =
          user.subscriptionProvider ??
          (user.paypalSubscriptionId
            ? "paypal"
            : user.stripeSubscriptionId || user.stripeCustomerId
              ? "stripe"
              : null);
        if (provider && user.subscriptionProvider !== provider) {
          await prisma.user.update({
            where: { clerkUserId: userId },
            data: {
              subscriptionProvider: provider,
              subscriptionProviderUpdatedAt: new Date(),
            },
          });
        }
        if (provider === "stripe") {
          let remoteSubscription: Stripe.Subscription | null = null;
          if (user.stripeSubscriptionId) {
            try {
              remoteSubscription = await getStripeClient().subscriptions.retrieve(
                user.stripeSubscriptionId,
                { expand: ["items.data.price"] }
              );
            } catch {
            }
          }
          if (!remoteSubscription && user.stripeCustomerId) {
            try {
              const subscriptions = await getStripeClient().subscriptions.list({
                customer: user.stripeCustomerId,
                status: "all",
                limit: 10,
                expand: ["data.items.data.price"],
              });
              remoteSubscription =
                subscriptions.data.find((sub) => sub.id === user.stripeSubscriptionId) ??
                subscriptions.data[0] ??
                null;
            } catch {
            }
          }
          if (remoteSubscription) {
            resolvedStatus = remoteSubscription.status;
            resolvedPriceId = remoteSubscription.items.data[0]?.price?.id ?? resolvedPriceId;
            resolvedCancelAtPeriodEnd = Boolean(
              remoteSubscription.cancel_at_period_end || remoteSubscription.cancel_at
            );
            const remotePeriodSeconds = resolveRemotePeriodSeconds(remoteSubscription);
            resolvedPeriodEnd =
              typeof remotePeriodSeconds === "number" && Number.isFinite(remotePeriodSeconds)
                ? new Date(remotePeriodSeconds * 1000)
                : resolvedPeriodEnd;
            const resolvedTierFromStripe = shouldGrantSupporterBadge(resolvedStatus)
              ? getTierFromPriceId(resolvedPriceId, getStripePriceMap())
              : 0;
            await prisma.user.update({
              where: { clerkUserId: userId },
              data: {
                stripeSubscriptionId: remoteSubscription.id,
                subscriptionStatus: resolvedStatus,
                subscriptionPriceId: resolvedPriceId,
                subscriptionCancelAtPeriodEnd: resolvedCancelAtPeriodEnd,
                subscriptionCurrentPeriodEnd: resolvedPeriodEnd,
                supporterTier: resolvedTierFromStripe,
                pendingSubscriptionPriceId: null,
              },
            });
          }
        }
        if (provider === "paypal" && paypalEnabled && user.paypalSubscriptionId) {
          try {
            const remoteSubscription = await fetchPayPalSubscription(user.paypalSubscriptionId);
            resolvedStatus = remoteSubscription.status ?? resolvedStatus;
            const now = Date.now();
            const previousPeriodEndMs = resolvedPeriodEnd ? resolvedPeriodEnd.getTime() : null;
            const shouldPromotePendingPrice =
              Boolean(resolvedPendingPriceId) &&
              remoteSubscription.planId === resolvedPendingPriceId &&
              (previousPeriodEndMs === null || previousPeriodEndMs <= now);
            if (shouldPromotePendingPrice) {
              resolvedPriceId = resolvedPendingPriceId;
              resolvedPendingPriceId = null;
            } else if (!resolvedPendingPriceId) {
              resolvedPriceId = remoteSubscription.planId ?? resolvedPriceId;
            }
            resolvedCancelAtPeriodEnd = remoteSubscription.cancelAtPeriodEnd;
            resolvedPeriodEnd = remoteSubscription.nextBillingTime
              ? new Date(remoteSubscription.nextBillingTime)
              : resolvedPeriodEnd;
            const resolvedTierFromPayPal =
              paypalEnabled && isActiveSubscriptionStatus(resolvedStatus)
                ? getTierFromPriceId(resolvedPriceId, getPayPalPlanMap())
                : 0;
            await prisma.user.update({
              where: { clerkUserId: userId },
              data: {
                paypalSubscriptionId: remoteSubscription.id,
                paypalPayerId: remoteSubscription.payerId,
                subscriptionStatus: resolvedStatus,
                subscriptionPriceId: resolvedPriceId,
                pendingSubscriptionPriceId: resolvedPendingPriceId,
                subscriptionCancelAtPeriodEnd: resolvedCancelAtPeriodEnd,
                subscriptionCurrentPeriodEnd: resolvedPeriodEnd,
                supporterTier: resolvedTierFromPayPal,
              },
            });
          } catch {
          }
        }

        const isActive = isActiveSubscriptionStatus(resolvedStatus);
        const providerPriceMap =
          provider === "paypal" && paypalEnabled ? getPayPalPlanMap() : getStripePriceMap();
        const tier = isActive ? getTierFromPriceId(resolvedPriceId, providerPriceMap) : 0;
        const pendingTier =
          provider === "paypal" && paypalEnabled && resolvedPendingPriceId
            ? getTierFromPriceId(resolvedPendingPriceId, getPayPalPlanMap())
            : 0;

        subscription = {
          provider,
          tier,
          tierLabel: TIER_LABELS[tier] ?? "None",
          status: resolvedStatus,
          cancelAtPeriodEnd: resolvedCancelAtPeriodEnd,
          currentPeriodEnd: resolvedPeriodEnd
            ? resolvedPeriodEnd.toISOString()
            : null,
          hasStripeCustomer: !!user.stripeCustomerId,
          hasPayPalSubscription: !!user.paypalSubscriptionId,
          pendingTier: pendingTier > 0 ? pendingTier : null,
          pendingTierLabel: pendingTier > 0 ? TIER_LABELS[pendingTier] ?? null : null,
        };
      }
    }
  } catch {
    // auth context unavailable, render unauthenticated view
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <BillingClient
        checkoutStatus={checkoutStatus}
        switchStatus={switchStatus}
        checkoutSessionId={checkoutSessionId}
        subscription={subscription}
        isSignedIn={isSignedIn}
      />
    </div>
  );
};

export default BillingPage;
