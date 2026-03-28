import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Footer from "./footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import SupportPromptModal from "./components/SupportPromptModal";
import prisma from "../../prisma/prismaClient";
import { isAdminClerkUserId } from "@/server/adminAuth";
import { isEffectivelySupporter } from "@/server/supporterStatus";

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
  let isSupporter = false;
  let isAdmin = false;
  try {
    const { userId } = await auth();
    isAdmin = isAdminClerkUserId(userId);
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: {
          supporterTier: true,
          subscriptionStatus: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
        },
      });
      isSupporter = isEffectivelySupporter(user);
    }
  } catch {
    isSupporter = false;
    isAdmin = false;
  }

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
              <Navbar />
              <SupportPromptModal isSupporter={isSupporter} isAdmin={isAdmin} />
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
        </ClerkProvider>
      </body>
    </html>
  );
}
