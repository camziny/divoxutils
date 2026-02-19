import { auth } from "@clerk/nextjs/server";
import AdminIdentityClaimsClient from "./AdminIdentityClaimsClient";
import { isAdminClerkUserId } from "@/server/adminAuth";

export const metadata = {
  title: "Admin Identity Claims - divoxutils",
};

export default async function AdminIdentityClaimsPage() {
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

  return <AdminIdentityClaimsClient />;
}
