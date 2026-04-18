import dynamic from "next/dynamic";

const DraftTestPageClient = dynamic(() => import("./_components/DraftTestPageClient"), {
  ssr: false,
});

export default function DraftTestPage() {
  return <DraftTestPageClient />;
}
