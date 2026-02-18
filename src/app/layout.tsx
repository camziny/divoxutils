import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Footer from "./footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { Toaster } from "sonner";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: "#111827",
          colorInputBackground: "#1f2937",
          colorText: "#e5e7eb",
          colorTextSecondary: "#9ca3af",
          colorPrimary: "#6366f1",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <div className="flex flex-col min-h-screen">
            <Providers>
              <Navbar />
              {children}
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
        </body>
      </html>
    </ClerkProvider>
  );
}
