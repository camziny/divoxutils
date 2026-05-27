import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
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
import JsonLd from "@/components/seo/JsonLd";
import { isSearchEngineCrawler } from "@/lib/crawler";
import {
  DEFAULT_DESCRIPTION,
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "divoxutils — Dark Age of Camelot (DAoC) tools",
    template: "%s | divoxutils",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: "divoxutils — Dark Age of Camelot (DAoC) tools",
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE_PATH],
    url: SITE_URL,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE_PATH],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  about: {
    "@type": "VideoGame",
    name: "Dark Age of Camelot",
    alternateName: ["DAoC"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSupporter, isAdmin, hasSupporterDeviceGrace } = await getLayoutViewerContext();
  const paypalEnabled = isPayPalSubscriptionsEnabled();
  const userAgent = (await headers()).get("user-agent");
  const suppressSupportPromptAutoOpen = isSearchEngineCrawler(userAgent);

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
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
                hasSupporterDeviceGrace={hasSupporterDeviceGrace}
                paypalEnabled={paypalEnabled}
                suppressAutoOpen={suppressSupportPromptAutoOpen}
              />
              <SignedOutNudge hasSupporterDeviceGrace={hasSupporterDeviceGrace} />
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
