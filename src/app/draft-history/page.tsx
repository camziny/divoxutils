import { getDraftLogRows } from "@/server/draftStats";
import DraftHistoryClient from "./DraftHistoryClient";

export const metadata = {
  title: "Draft History - divoxutils",
};

export default async function DraftHistoryPage() {
  const rows = await getDraftLogRows();

  return <DraftHistoryClient initialRows={rows} />;
}
