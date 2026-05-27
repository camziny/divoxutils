import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Drafts",
  description:
    "Dark Age of Camelot (DAoC) community drafts on divoxutils. Start drafts in Discord or browse draft history and leaderboards.",
  path: "/draft",
  openGraphTitle: "DAoC drafts — divoxutils",
});

export default function DraftPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Draft</h1>
        <p className="text-sm text-gray-500">
          Use the <span className="text-gray-400 font-medium">/draft</span> command in Discord to start a new draft.
        </p>
      </div>
    </div>
  );
}
