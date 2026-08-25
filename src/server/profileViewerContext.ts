import { auth } from "@clerk/nextjs/server";
import { isAdminClerkUserId } from "@/server/adminAuth";

export type ProfileViewerContext = {
  isOwner: boolean;
  isAdmin: boolean;
  canViewHiddenProfile: boolean;
};

export async function getProfileViewerContext(
  profileClerkUserId: string
): Promise<ProfileViewerContext> {
  let isOwner = false;
  let isAdmin = false;

  try {
    const { userId } = await auth();
    isAdmin = isAdminClerkUserId(userId);
    isOwner = Boolean(userId) && userId === profileClerkUserId;
  } catch {
    isOwner = false;
    isAdmin = false;
  }

  return { isOwner, isAdmin, canViewHiddenProfile: isOwner || isAdmin };
}

export function isProfileHiddenForViewer(
  hideProfile: boolean,
  viewer: Pick<ProfileViewerContext, "canViewHiddenProfile">
): boolean {
  return hideProfile && !viewer.canViewHiddenProfile;
}
