"use client";

import React from "react";
import SupporterBadge from "@/components/support/SupporterBadge";
import { SUPPORTER_TIER_PLANS } from "../_lib/supporterTierPlans";

export default function SupporterTiersShowcase() {
  return (
    <div className="space-y-3">
      {SUPPORTER_TIER_PLANS.map(({ tier, label, description }) => (
        <div
          key={tier}
          className={`flex items-center gap-4 rounded-md border px-4 py-3 ${
            tier === 3
              ? "border-indigo-500/20 bg-indigo-500/[0.06]"
              : "border-gray-800 bg-gray-800/20"
          }`}
        >
          <SupporterBadge tier={tier} size="md" showTooltip={false} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-white">{label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
