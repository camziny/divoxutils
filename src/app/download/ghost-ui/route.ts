import { NextResponse } from "next/server";
import ghostUiRelease from "@/lib/ghost-ui.release.json";

export function GET() {
  const url =
    process.env.GHOST_UI_RELEASE_DOWNLOAD_URL?.trim() ||
    ghostUiRelease.downloadUrl;
  return NextResponse.redirect(url, 302);
}
