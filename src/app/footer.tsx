import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/support" className="hover:text-gray-300 transition-colors">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-gray-500 text-sm">© 2023-2026 divoxutils</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
