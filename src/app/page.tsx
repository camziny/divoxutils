import React from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import HomeCarousel from "./components/HomeCarousel";
export default function HomePage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="container mx-auto p-8">
        <header className="text-center py-10">
          <h1 className="text-5xl font-extrabold mb-2">
            <Link href="/user/divox/characters">
              <div className="text-indigo-500 hover:text-indigo-400 inline">
                divox
              </div>
            </Link>
            <span className="text-white inline">utils</span>
          </h1>
        </header>
        <HomeCarousel />
      </div>
    </div>
  );
}
