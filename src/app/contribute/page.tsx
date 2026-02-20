import React from "react";
import SupporterTiersShowcase from "./SupporterTiersShowcase";

export const metadata = {
  title: "Contribute - divoxutils",
};

const ContributePage = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-10">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Contribute
          </h1>
          <p className="text-sm leading-relaxed text-gray-400">
            divoxutils is free to use but has real costs&mdash;hosting, database,
            and infrastructure. Contributions through{" "}
            <a
              href="https://ko-fi.com/divox#checkoutModal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Ko-fi
            </a>{" "}
            go directly toward keeping things running and funding future
            development.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            Cumulative contributions are tracked and automatically apply a
            supporter tier to your account. This just adds a small visual
            indicator next to your name on the site.
          </p>
        </header>

        <SupporterTiersShowcase />

        <div className="text-center pt-4">
          <a
            href="https://ko-fi.com/divox#checkoutModal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-500/20 px-6 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          >
            Contribute on Ko-fi
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContributePage;
