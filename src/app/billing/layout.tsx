import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
};

import type { ReactNode } from "react";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return children;
}
