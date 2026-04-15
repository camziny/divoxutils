import dynamic from "next/dynamic";

const DraftTestPageClient = dynamic(() => import("./DraftTestPageClient"), {
  ssr: false,
});

export default function DraftTestPage() {
  return <DraftTestPageClient />;
}
