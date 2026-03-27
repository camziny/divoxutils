import React from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../prisma/prismaClient";
import SubscribeInline from "./SubscribeInline";

export const metadata = {
  title: "Contribute - divoxutils",
};

const MONTHLY_COSTS = {
  vercelPro: 20,
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
const estimatedMonthlyLow = fixedMonthly + MONTHLY_COSTS.computeLow;
const estimatedMonthlyHigh = fixedMonthly + MONTHLY_COSTS.computeHigh;
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
        select: { supporterTier: true },
      });
      if (user?.supporterTier && user.supporterTier > 0) {
        activeTier = user.supporterTier;
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
        </header>

        <section className="rounded-lg border border-gray-800 bg-gray-800/20 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Cost Transparency
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center justify-between gap-3">
              <span>Cloud hosting and runtime infrastructure</span>
              <span className="text-gray-200">${MONTHLY_COSTS.vercelPro} / mo</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Discord bot hosting</span>
              <span className="text-gray-200">${MONTHLY_COSTS.discordBotHost} / mo</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Database and storage</span>
              <span className="text-gray-200">${MONTHLY_COSTS.managedDatabaseBudget} / mo</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Domain name registration</span>
              <span className="text-gray-200">${domainMonthly.toFixed(2)} / mo</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Cloud compute and usage overages (variable)</span>
              <span className="text-gray-200">
                ${MONTHLY_COSTS.computeLow} - ${MONTHLY_COSTS.computeHigh} / mo
              </span>
            </div>
          </div>
          <div className="h-px bg-gray-800" />
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total costs</p>
            <div className="flex items-center justify-between text-gray-300">
              <span>Monthly</span>
              <span className="text-white font-medium">~${displayMonthlyLow} – ${displayMonthlyHigh}</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Annual</span>
              <span className="text-white font-medium">~${displayAnnualLow} – ${displayAnnualHigh}</span>
            </div>
          </div>
        </section>

        <SubscribeInline activeTier={activeTier} />
      </div>
    </div>
  );
};

export default ContributePage;
