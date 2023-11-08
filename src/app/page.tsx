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
            <Link href="/users/user_2XJ2G6uNp3SZazCERjN0HJEdlGa/characters">
              <div className="text-indigo-500 hover:text-indigo-400 inline">
                divox
              </div>
            </Link>
            <span className="text-white inline">utils</span>
          </h1>
        </header>
        <HomeCarousel />
        {/* <section className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 border-b border-indigo-400 pb-3">
            The Top 10
          </h2>
          <ul>
            {Array(10)
              .fill(0)
              .map((_, index) => (
                <li
                  key={index}
                  className="bg-gray-800 p-5 mb-4 rounded-md hover:bg-gray-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
                >
                  {index + 1}.
                </li>
              ))}
          </ul>
        </section> */}
      </div>
    </div>
  );
}
