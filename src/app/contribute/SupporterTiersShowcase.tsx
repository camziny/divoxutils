"use client";

import React from "react";
import SupporterBadge, { SUPPORTER_TIERS } from "@/app/components/SupporterBadge";

export default function SupporterTiersShowcase() {
  return (
    <div className="space-y-3">
      {SUPPORTER_TIERS.map(({ tier, label, threshold, description }) => (
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
              <span className="text-xs text-gray-500">{threshold}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
