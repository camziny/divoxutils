import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import HomeCarousel from "./_components/HomeCarousel";

export const metadata: Metadata = {
  title: "Home - divoxutils",
  description:
    "divoxutils helps Dark Age of Camelot players track characters, compare stats, and stay connected to progress and milestones.",
  alternates: {
    canonical: "https://divoxutils.com",
  },
  openGraph: {
    title: "divoxutils",
    description:
      "Track characters, compare progress, and follow Dark Age of Camelot leaderboards on divoxutils.",
    url: "https://divoxutils.com",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "divoxutils",
    description:
      "Track characters, compare progress, and follow Dark Age of Camelot leaderboards on divoxutils.",
    images: ["/wh-big.png"],
  },
};

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
