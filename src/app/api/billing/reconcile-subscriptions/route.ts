import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/prismaClient";
import { hasValidCronAuthorization, postMethodNotAllowedResponse, unauthorizedCronResponse } from "@/server/api/cronAuth";
import { fetchPayPalSubscription, getPayPalPlanMap, isPayPalSubscriptionsEnabled } from "@/server/billing/paypal";
import { extractRecurringPriceId, getStripeClient, getStripePriceMap, getTierFromPriceId, shouldGrantSupporterBadge } from "@/server/billing/stripe";
import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";

const hasFutureGraceAccess = (params: {
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
  nowMs?: number;
}): boolean => {
  if (!params.cancelAtPeriodEnd || !params.periodEnd) return false;
  const nowMs = params.nowMs ?? Date.now();
  return params.periodEnd.getTime() > nowMs;
};

const run = async (method: string, request: NextRequest) => {
  if (!hasValidCronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return unauthorizedCronResponse();
  }

  if (method !== "POST") {
    return postMethodNotAllowedResponse(method);
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { subscriptionProvider: { in: ["stripe", "paypal"] } },
        {
          subscriptionProvider: null,
          OR: [
            { stripeSubscriptionId: { not: null } },
            { stripeCustomerId: { not: null } },
            { paypalSubscriptionId: { not: null } },
            { paypalPayerId: { not: null } },
          ],
        },
      ],
    },
    select: {
      clerkUserId: true,
      subscriptionProvider: true,
      subscriptionStatus: true,
      subscriptionPriceId: true,
      pendingSubscriptionPriceId: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      paypalSubscriptionId: true,
      paypalPayerId: true,
      supporterTier: true,
    },
    take: 500,
  });

  const stripePriceMap = getStripePriceMap();
  const paypalPlanMap = isPayPalSubscriptionsEnabled() ? getPayPalPlanMap() : null;
  let checked = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const user of users) {
    checked += 1;
    try {
      const provider =
        user.subscriptionProvider ??
        (user.paypalSubscriptionId
          ? "paypal"
          : user.stripeSubscriptionId || user.stripeCustomerId
            ? "stripe"
            : null);

      if (provider === "stripe" && user.stripeSubscriptionId) {
        const subscription = await getStripeClient().subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ["items.data.price"],
        });
        const priceId = extractRecurringPriceId(subscription);
        const status = subscription.status;
        const periodEnd =
          typeof (subscription as unknown as { current_period_end?: number }).current_period_end ===
          "number"
            ? new Date(
                ((subscription as unknown as { current_period_end?: number }).current_period_end ?? 0) *
                  1000
              )
            : user.subscriptionCurrentPeriodEnd;
        const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end || subscription.cancel_at);
        const supporterTier = shouldGrantSupporterBadge(status)
          ? getTierFromPriceId(priceId, stripePriceMap)
          : 0;
        const changed =
          user.subscriptionProvider !== provider ||
          user.subscriptionStatus !== status ||
          user.subscriptionPriceId !== priceId ||
          user.subscriptionCancelAtPeriodEnd !== cancelAtPeriodEnd ||
          user.supporterTier !== supporterTier ||
          (periodEnd?.toISOString() ?? null) !== (user.subscriptionCurrentPeriodEnd?.toISOString() ?? null);
        if (changed) {
          await prisma.user.update({
            where: { clerkUserId: user.clerkUserId },
            data: {
              subscriptionProvider: provider,
              subscriptionProviderUpdatedAt:
                user.subscriptionProvider !== provider ? new Date() : undefined,
              subscriptionStatus: status,
              subscriptionPriceId: priceId,
              subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
              subscriptionCurrentPeriodEnd: periodEnd,
              supporterTier,
            },
          });
          updated += 1;
        }
      }

      if (provider === "paypal" && paypalPlanMap && user.paypalSubscriptionId) {
        const subscription = await fetchPayPalSubscription(user.paypalSubscriptionId);
        const status = subscription.status;
        const periodEnd = subscription.nextBillingTime
          ? new Date(subscription.nextBillingTime)
          : user.subscriptionCurrentPeriodEnd;
        const now = Date.now();
        const currentPeriodEndMs = user.subscriptionCurrentPeriodEnd?.getTime() ?? null;
        const shouldPromotePendingPrice =
          Boolean(user.pendingSubscriptionPriceId) &&
          subscription.planId === user.pendingSubscriptionPriceId &&
          (currentPeriodEndMs === null || currentPeriodEndMs <= now);
        const nextSubscriptionPriceId =
          user.pendingSubscriptionPriceId && !shouldPromotePendingPrice
            ? user.subscriptionPriceId
            : subscription.planId;
        const nextPendingSubscriptionPriceId =
          shouldPromotePendingPrice || !isActiveSubscriptionStatus(status)
            ? null
            : user.pendingSubscriptionPriceId;
        const supporterTier =
          (status && isActiveSubscriptionStatus(status)) ||
          hasFutureGraceAccess({
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            periodEnd,
            nowMs: now,
          })
            ? getTierFromPriceId(nextSubscriptionPriceId, paypalPlanMap)
            : 0;
        const changed =
          user.subscriptionProvider !== provider ||
          user.subscriptionStatus !== status ||
          user.subscriptionPriceId !== nextSubscriptionPriceId ||
          user.pendingSubscriptionPriceId !== nextPendingSubscriptionPriceId ||
          user.subscriptionCancelAtPeriodEnd !== subscription.cancelAtPeriodEnd ||
          user.supporterTier !== supporterTier ||
          user.paypalPayerId !== subscription.payerId ||
          (periodEnd?.toISOString() ?? null) !== (user.subscriptionCurrentPeriodEnd?.toISOString() ?? null);
        if (changed) {
          await prisma.user.update({
            where: { clerkUserId: user.clerkUserId },
            data: {
              subscriptionProvider: provider,
              subscriptionProviderUpdatedAt:
                user.subscriptionProvider !== provider ? new Date() : undefined,
              subscriptionStatus: status,
              subscriptionPriceId: nextSubscriptionPriceId,
              pendingSubscriptionPriceId: nextPendingSubscriptionPriceId,
              subscriptionCancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              subscriptionCurrentPeriodEnd: periodEnd,
              paypalPayerId: subscription.payerId,
              supporterTier,
            },
          });
          updated += 1;
        }
      }
    } catch {
      errors.push(user.clerkUserId);
    }
  }

  return NextResponse.json({
    checked,
    updated,
    errors,
  });
};

export const POST = async (request: NextRequest) => run("POST", request);
export const GET = async (request: NextRequest) => run("GET", request);
export const PUT = async (request: NextRequest) => run("PUT", request);
export const PATCH = async (request: NextRequest) => run("PATCH", request);
export const DELETE = async (request: NextRequest) => run("DELETE", request);
export const OPTIONS = async (request: NextRequest) => run("OPTIONS", request);
export const HEAD = async (request: NextRequest) => run("HEAD", request);
