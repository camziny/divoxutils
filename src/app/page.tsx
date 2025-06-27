import React from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import HomeCarousel from "./components/HomeCarousel";

export const metadata = {
  title: "Home - divoxutils",
};

export default function HomePage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="container mx-auto p-8">
        <header className="text-center py-16">
          <div className="relative">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
              <Link href="/user/divox/characters">
                <div className="group inline-block relative">
                  <span className="text-indigo-400 hover:text-indigo-300 transition-all duration-300 transform group-hover:scale-105">
                    divox
                  </span>
                  <div className="absolute -inset-2 bg-indigo-600/10 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </Link>
              <span className="text-white drop-shadow-lg">utils</span>
            </h1>
            <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
        </header>
        <HomeCarousel />
      </div>
    </div>
  );
}
