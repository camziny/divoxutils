import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./_components/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "./_components/footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./_components/providers";
import { Toaster } from "sonner";
import SupportPromptModal from "@/components/support/SupportPromptModal";
import SignedOutNudge from "@/components/auth/SignedOutNudge";
import { getLayoutViewerContext } from "@/server/layoutViewerContext";
import { isPayPalSubscriptionsEnabled } from "@/server/billing/paypal";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://divoxutils.com'),
  title: "divoxutils",
  description:
    "divoxutils is a hub for Dark Age of Camelot players. Join us to track your progress, share your milestones, and shape the future of this evolving platform",
  openGraph: {
    title: "divoxutils",
    description: "divoxutils is a hub for Dark Age of Camelot players. Join us to track your progress, share your milestones, and shape the future of this evolving platform",
    images: ["/wh-big.png"],
    url: "https://divoxutils.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/wh-big.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSupporter, isAdmin } = await getLayoutViewerContext();
  const paypalEnabled = isPayPalSubscriptionsEnabled();

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ClerkProvider
          appearance={{
            variables: {
              colorBackground: "#111827",
              colorInput: "#1f2937",
              colorForeground: "#e5e7eb",
              colorMutedForeground: "#9ca3af",
              colorPrimary: "#6366f1",
              colorNeutral: "#6b7280",
            },
          }}
        >
          <div className="flex flex-col min-h-screen">
            <Providers>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-gray-900 focus:px-3 focus:py-2 focus:text-sm focus:text-gray-100 focus:ring-2 focus:ring-indigo-400"
              >
                Skip to main content
              </a>
              <Navbar />
              <SupportPromptModal
                isSupporter={isSupporter}
                isAdmin={isAdmin}
                paypalEnabled={paypalEnabled}
              />
              <SignedOutNudge />
              <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
                {children}
              </main>
              <SpeedInsights />
              <Analytics />
              <Footer />
              <Toaster
                theme="dark"
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "#1f2937",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                  },
                }}
              />
            </Providers>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
