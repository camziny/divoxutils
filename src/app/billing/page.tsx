import React from "react";
import { auth } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import prisma from "../../../prisma/prismaClient";
import {
  getStripeClient,
  getStripePriceMap,
  getTierFromPriceId,
  shouldGrantSupporterBadge,
} from "@/server/billing/stripe";
import BillingClient from "./BillingClient";

export const metadata = {
  title: "Billing - divoxutils",
};

type BillingPageProps = {
  searchParams?: {
    checkout?: "success" | "cancel";
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

  let subscription: {
    tier: number;
    tierLabel: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    hasStripeCustomer: boolean;
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
          stripeSubscriptionId: true,
          stripeCustomerId: true,
        },
      });

      if (user) {
        let resolvedStatus = user.subscriptionStatus ?? "none";
        let resolvedPriceId = user.subscriptionPriceId ?? null;
        let resolvedCancelAtPeriodEnd = user.subscriptionCancelAtPeriodEnd;
        let resolvedPeriodEnd = user.subscriptionCurrentPeriodEnd;
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
            },
          });
        }

        const isActive =
          resolvedStatus === "active" ||
          resolvedStatus === "trialing" ||
          resolvedStatus === "past_due";
        const tier = isActive
          ? getTierFromPriceId(resolvedPriceId, getStripePriceMap())
          : 0;

        subscription = {
          tier,
          tierLabel: TIER_LABELS[tier] ?? "None",
          status: resolvedStatus,
          cancelAtPeriodEnd: resolvedCancelAtPeriodEnd,
          currentPeriodEnd: resolvedPeriodEnd
            ? resolvedPeriodEnd.toISOString()
            : null,
          hasStripeCustomer: !!user.stripeCustomerId,
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
        checkoutSessionId={checkoutSessionId}
        subscription={subscription}
        isSignedIn={isSignedIn}
      />
    </div>
  );
};

export default BillingPage;
