import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Character search",
  description:
    "Search Dark Age of Camelot (DAoC) players and characters on divoxutils, or browse public profiles.",
  path: "/character-search",
});

export default function CharacterSearchPage() {
  redirect("/search");
}
