import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dashboard",
  ...NOINDEX_METADATA,
};

import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
