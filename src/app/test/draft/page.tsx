import dynamic from "next/dynamic";
import ConvexClientProvider from "@/app/draft/_components/ConvexClientProvider";

const DraftTestPageClient = dynamic(() => import("./_components/DraftTestPageClient"), {
  ssr: false,
});

export default function DraftTestPage() {
  return (
    <ConvexClientProvider>
      <DraftTestPageClient />
    </ConvexClientProvider>
  );
}
