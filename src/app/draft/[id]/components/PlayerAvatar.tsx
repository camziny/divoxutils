import Image from "next/image";
import { User } from "lucide-react";

export default function PlayerAvatar({
  url,
  name,
  size = 20,
}: {
  url?: string;
  name?: string;
  size?: number;
}) {
  if (!url) {
    return (
      <div
        className="rounded-full shrink-0 bg-gray-700 text-gray-200 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <User size={Math.max(10, Math.floor(size * 0.6))} />
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={name ?? "Player avatar"}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      unoptimized
    />
  );
}
