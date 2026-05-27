import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
