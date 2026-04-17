import { getDraftLogRows } from "@/server/draftStats";
import DraftHistoryClient from "./_components/DraftHistoryClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata = {
  title: "Draft History - divoxutils",
};

export default async function DraftHistoryPage() {
  const rows = await getDraftLogRows();

  return <DraftHistoryClient initialRows={rows} />;
}
