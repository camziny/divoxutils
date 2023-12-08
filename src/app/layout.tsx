import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./navbar";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "./footer";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "divoxutils",
  description:
    "divoxutils is a hub for Dark Age of Camelot players. Join us to track your progress, share your milestones, and shape the future of this evolving platform",
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
            content="divoxutils is a hub for Dark Age of Camelot players. Join us to track your progress, share your milestones, and shape the future of this evolving platform."
          />
          <meta property="og:title" content="divoxutils" />
          <meta
            property="og:description"
            content="divoxutils is a hub for Dark Age of Camelot players. Join us to track your progress, share your milestones, and shape the future of this evolving platform."
          />
          <meta property="og:image" content="/wh-big.png" />
          <meta property="og:url" content="https://divoxutils.com" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="/wh-big.png" />
          <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        </Head>
        <body className={`${inter.className} antialiased`}>
          <Providers>
            <Navbar />
            {children}
            <SpeedInsights />
            <Analytics />
            <Footer />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
