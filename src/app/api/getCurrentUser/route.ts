import { auth, clerkClient } from "@clerk/nextjs/server";
import { createGetCurrentUserRouteHandlers } from "@/server/getCurrentUserRouteHandlers";

const handlers = createGetCurrentUserRouteHandlers({
  deps: {
    getAuthUserId: async () => (await auth()).userId ?? null,
    getClerkUser: async (userId: string) => {
      const client = await clerkClient();
      return client.users.getUser(userId);
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
