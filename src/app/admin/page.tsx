import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { isAdminClerkUserId } from "@/server/adminAuth";

export const metadata = {
  title: "Admin - divoxutils",
};

export default async function AdminPage() {
  const { userId } = auth();
  const isAdmin = isAdminClerkUserId(userId);

  if (!isAdmin) {
    return (
      <div className="bg-gray-900 min-h-screen text-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm">Your account does not have administrator privileges.</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      href: "/admin/drafts",
      title: "Draft Moderation",
      description: "Review completed drafts and verify or void results before they count toward leaderboard records.",
    },
    {
      href: "/admin/identity-claims",
      title: "Identity Claims",
      description: "Approve or reject manual Discord identity claims from users linking their draft participation to their account.",
    },
    {
      href: "/admin/supporters",
      title: "Supporters",
      description: "Manage supporter tiers for users who have contributed to help cover hosting and development costs.",
    },
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Manage identity claims and moderate draft results.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-lg border border-gray-800 p-5 transition-colors hover:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                  {card.title}
                </h2>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
