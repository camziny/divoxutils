import DraftClient from "./DraftClient";

export const metadata = {
  title: "Draft - divoxutils",
};

export default function DraftPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <DraftClient shortId={params.id} token={searchParams.token} />
      </div>
    </div>
  );
}
