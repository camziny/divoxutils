import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/support" className="hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 rounded-sm">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 rounded-sm">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 rounded-sm">
              Terms
            </Link>
          </div>
          <p className="text-gray-400 text-sm">© 2023-2026 divoxutils</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
