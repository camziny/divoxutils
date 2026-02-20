import { auth } from "@clerk/nextjs/server";
import { isAdminClerkUserId } from "@/server/adminAuth";
import AdminSupportersClient from "./AdminSupportersClient";

export const metadata = {
  title: "Admin Supporters - divoxutils",
};

export default async function AdminSupportersPage() {
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

  return <AdminSupportersClient />;
}
