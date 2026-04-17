import ConvexClientProvider from "./_components/ConvexClientProvider";

export default function DraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
