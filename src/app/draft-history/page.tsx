import type { Metadata } from "next";
import { getDraftLogRows } from "@/server/draftStats";
import DraftHistoryClient from "./_components/DraftHistoryClient";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Draft history",
  description:
    "Dark Age of Camelot (DAoC) community draft history on divoxutils. Browse past draft events, outcomes, and player participation.",
  path: "/draft-history",
  openGraphTitle: "DAoC draft history — divoxutils",
});

export default async function DraftHistoryPage() {
  const rows = await getDraftLogRows();

  return <DraftHistoryClient initialRows={rows} />;
}
