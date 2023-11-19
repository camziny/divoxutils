import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./navbar";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "./footer";
import Head from "next/head";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "divoxutils",
  description: "by divox",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <Head>
          <title>divoxutils</title>
          <meta
            name="description"
            content="A hub for Dark Age of Camelot enthusiasts, divoxutils enhances gameplay with character tracking and community features. Join us in evolving this platform."
          />
          <meta property="og:title" content="divoxutils" />
          <meta
            property="og:description"
            content="A hub for Dark Age of Camelot enthusiasts, divoxutils enhances gameplay with character tracking and community features. Join us in evolving this platform."
          />
          <meta
            property="og:image"
            content="https://divoxutils.com/wh-big.png"
          />
          <meta property="og:url" content="https://divoxutils.com" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="divoxutils - Your DAoC Companion"
          />
          <meta
            name="twitter:description"
            content="A hub for Dark Age of Camelot enthusiasts, divoxutils enhances gameplay with character tracking and community features. Join us in evolving this platform."
          />
          <meta
            name="twitter:image"
            content="https://divoxutils.com/wh-big.png"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body className={inter.className}>
          <Navbar />
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
