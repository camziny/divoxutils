import ConvexClientProvider from "./ConvexClientProvider";

export default function DraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
