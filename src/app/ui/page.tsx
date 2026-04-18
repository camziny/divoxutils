import React from "react";
import type { Metadata } from "next";
import { HiArrowDownTray } from "react-icons/hi2";

export const metadata: Metadata = {
  title: "Ghost UI - divoxutils",
  description: "Download Ghost UI for Dark Age of Camelot.",
  alternates: {
    canonical: "https://divoxutils.com/ui",
  },
  openGraph: {
    title: "Ghost UI - divoxutils",
    description: "Download Ghost UI for Dark Age of Camelot.",
    url: "https://divoxutils.com/ui",
    type: "website",
    images: ["/wh-big.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost UI - divoxutils",
    description: "Download Ghost UI for Dark Age of Camelot.",
    images: ["/wh-big.png"],
  },
};

export default function UiPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-16">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ghost UI
          </h1>
          <p className="text-sm text-gray-400 max-w-lg leading-relaxed">
            A lightly modified Ghost UI. The realm rank chart now extends to
            15L0, and a stability issue that could crash the game has been
            fixed.
          </p>
          <div className="pt-2">
            <a
              href="/download/ghost-ui"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              <HiArrowDownTray className="h-3.5 w-3.5" />
              Download Ghost UI
            </a>
          </div>
        </header>

        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
            Install (Windows)
          </p>
          <ol className="text-sm text-gray-400 leading-relaxed list-decimal pl-5 space-y-2">
            <li>Close Dark Age of Camelot.</li>
            <li>
              Open your game folder and go into the{" "}
              <span className="text-gray-300">ui</span> folder. The default
              location is usually{" "}
              <span className="font-mono text-xs text-gray-500 break-all">
                C:\Program Files (x86)\Electronic Arts\Dark Age of Camelot\ui
              </span>
              .
            </li>
            <li>
              Rename the existing{" "}
              <span className="text-gray-300">custom</span> folder to{" "}
              <span className="text-gray-300">custom_backup</span> so you can
              revert later if you want to.
            </li>
            <li>
              Extract the zip you downloaded. You&apos;ll get one folder named{" "}
              <span className="text-gray-300">custom</span>.
            </li>
            <li>
              Move that <span className="text-gray-300">custom</span> folder
              into the <span className="text-gray-300">ui</span> folder from
              step 2.
            </li>
            <li>
              Launch the game and set the UI option in game settings to{" "}
              <span className="text-gray-300">custom</span>.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
            Revert
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Delete the new <span className="text-gray-300">custom</span> folder
            and rename <span className="text-gray-300">custom_backup</span>{" "}
            back to <span className="text-gray-300">custom</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
