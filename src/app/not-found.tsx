import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">404</h1>
        <div className="h-8 w-px bg-gray-700" />
        <p className="text-sm text-gray-400">
          This page could not be found.{" "}
          <Link href="/" className="text-gray-300 underline underline-offset-4 hover:text-white transition-colors">
            Go home
          </Link>
        </p>
      </div>
    </div>
  );
}
