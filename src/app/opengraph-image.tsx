import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "divoxutils — Dark Age of Camelot (DAoC) community tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #111827 100%)",
          color: "#f9fafb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a5b4fc", marginBottom: 16, letterSpacing: 2 }}>
          DARK AGE OF CAMELOT
        </div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, marginBottom: 24 }}>
          <span style={{ color: "#818cf8" }}>divox</span>
          <span>utils</span>
        </div>
        <div style={{ fontSize: 32, color: "#d1d5db", maxWidth: 900, lineHeight: 1.4 }}>
          Character tracking, leaderboards, drafts, Discord bot
        </div>
      </div>
    ),
    { ...size }
  );
}
