import React from "react";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import prisma from "../../../prisma/prismaClient";
import SubscribeInline from "./_components/SubscribeInline";
import { getPayPalPlanMap, isPayPalSubscriptionsEnabled } from "@/server/billing/paypal";
import { getTierFromPriceId, getStripePriceMap } from "@/server/billing/stripe";
import { isActiveSubscriptionStatus } from "@/server/billing/subscriptionStatus";

export const metadata: Metadata = {
  title: "Contribute - divoxutils",
  description:
    "Support the project and help keep divoxutils online.",
  alternates: {
    canonical: "https://divoxutils.com/contribute",
  },
  openGraph: {
    title: "Contribute to divoxutils",
    description: "Support the project and help keep divoxutils online.",
    url: "https://divoxutils.com/contribute",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contribute to divoxutils",
    description: "Support the project and help keep divoxutils online.",
    images: ["/wh-big.png"],
  },
};

const MONTHLY_COSTS = {
  vercelPro: 20,
  qaSafetyLow: 5,
  qaSafetyHigh: 60,
  discordBotHost: 5,
  managedDatabaseBudget: 30,
  domainAnnual: 15,
  computeLow: 0,
  computeHigh: 5,
};

const domainMonthly = MONTHLY_COSTS.domainAnnual / 12;
const fixedMonthly =
  MONTHLY_COSTS.vercelPro +
  MONTHLY_COSTS.discordBotHost +
  MONTHLY_COSTS.managedDatabaseBudget +
  domainMonthly;
const estimatedMonthlyLow = fixedMonthly + MONTHLY_COSTS.qaSafetyLow + MONTHLY_COSTS.computeLow;
const estimatedMonthlyHigh = fixedMonthly + MONTHLY_COSTS.qaSafetyHigh + MONTHLY_COSTS.computeHigh;
const estimatedAnnualLow = estimatedMonthlyLow * 12;
const estimatedAnnualHigh = estimatedMonthlyHigh * 12;
const displayMonthlyLow = Math.round(estimatedMonthlyLow);
const displayMonthlyHigh = Math.round(estimatedMonthlyHigh);
const displayAnnualLow = Math.round(estimatedAnnualLow);
const displayAnnualHigh = Math.round(estimatedAnnualHigh);

const ContributePage = async () => {
  let activeTier: number | null = null;

  try {
    const { userId } = await auth();
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: {
          subscriptionProvider: true,
          subscriptionStatus: true,
          subscriptionPriceId: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          paypalSubscriptionId: true,
        },
      });
      const provider =
        user?.subscriptionProvider ??
        (user?.paypalSubscriptionId
          ? "paypal"
          : user?.stripeSubscriptionId || user?.stripeCustomerId
            ? "stripe"
            : null);
      if (
        provider &&
        isActiveSubscriptionStatus(user?.subscriptionStatus)
      ) {
        const priceMap =
          provider === "paypal" && isPayPalSubscriptionsEnabled()
            ? getPayPalPlanMap()
            : getStripePriceMap();
        const resolvedTier = getTierFromPriceId(user?.subscriptionPriceId, priceMap);
        activeTier = resolvedTier > 0 ? resolvedTier : null;
      }
    }
  } catch {
    activeTier = null;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-10">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Contribute
          </h1>
          <p className="text-sm leading-relaxed text-gray-400">
            divoxutils is free to use but has real costs each month. I keep this
            page up to date so support is transparent.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            Monthly support tiers are $1, $3, and $5. Support is handled through
            secure Stripe subscriptions and goes directly toward infrastructure
            costs.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            Supporter tiers add a visual icon next to your name. The goal is
            simple: keep the app online and cover recurring costs.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            If support ever goes beyond monthly infrastructure costs, any
            additional amount helps offset the time spent maintaining and
            improving divoxutils.
          </p>
        </header>

        <section className="rounded-lg border border-gray-800 bg-gray-800/20 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Cost Transparency
          </h2>
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
            <span className="text-gray-300">Cloud hosting and runtime infrastructure</span>
            <span className="text-gray-200 tabular-nums text-right">${MONTHLY_COSTS.vercelPro} / mo</span>
            <span className="text-gray-300">Database and storage</span>
            <span className="text-gray-200 tabular-nums text-right">${MONTHLY_COSTS.managedDatabaseBudget} / mo</span>
            <span className="text-gray-300">Automated QA and deployment safety</span>
            <span className="text-gray-200 tabular-nums text-right">
              ${MONTHLY_COSTS.qaSafetyLow} - ${MONTHLY_COSTS.qaSafetyHigh}+ / mo
            </span>
            <span className="text-gray-300">Discord bot hosting</span>
            <span className="text-gray-200 tabular-nums text-right">${MONTHLY_COSTS.discordBotHost} / mo</span>
            <span className="text-gray-300">Domain name registration</span>
            <span className="text-gray-200 tabular-nums text-right">${domainMonthly.toFixed(2)} / mo</span>
            <span className="text-gray-300">Cloud compute and usage overages (variable)</span>
            <span className="text-gray-200 tabular-nums text-right">
              ${MONTHLY_COSTS.computeLow} - ${MONTHLY_COSTS.computeHigh} / mo
            </span>
          </div>
          <div className="h-px bg-gray-800" />
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider col-span-2">Total costs</p>
            <span className="text-gray-300">Monthly estimate</span>
            <span className="text-white font-medium tabular-nums text-right">~${displayMonthlyLow} - ${displayMonthlyHigh}+</span>
            <span className="text-gray-300">Annual estimate</span>
            <span className="text-white font-medium tabular-nums text-right">~${displayAnnualLow} - ${displayAnnualHigh}+</span>
          </div>
        </section>

        <SubscribeInline
          activeTier={activeTier}
          paypalEnabled={isPayPalSubscriptionsEnabled()}
        />
      </div>
    </div>
  );
};

export default ContributePage;
