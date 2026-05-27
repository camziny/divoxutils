import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import HomeCarousel from "./_components/HomeCarousel";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Home",
  description:
    "divoxutils is a Dark Age of Camelot (DAoC) community tools site for character tracking, leaderboards, realm rank reference, draft history, Discord bot commands, and Ghost UI.",
  path: "/",
  openGraphTitle: "divoxutils — Dark Age of Camelot (DAoC) tools",
});

export default function HomePage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="container mx-auto p-8">
        <header className="text-center py-16">
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              <Link href="/user/divox/characters" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                divox
              </Link>
              <span className="text-white">utils</span>
            </h1>
            <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
        </header>
        <HomeCarousel />
      </div>
    </div>
  );
}
