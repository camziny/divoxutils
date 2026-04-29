import { isEffectivelySupporter } from "@/server/supporterStatus";

type SupporterDeviceUser = {
  supporterTier: number | null;
  subscriptionStatus: string | null;
  subscriptionCancelAtPeriodEnd: boolean | null;
  subscriptionCurrentPeriodEnd: Date | null;
};

type SupporterDeviceDeps = {
  getAuthUserId: () => Promise<string | null> | string | null;
  isAdminClerkUserId: (clerkUserId: string | null | undefined) => boolean;
  findUserByClerkId: (clerkUserId: string) => Promise<SupporterDeviceUser | null>;
  createCookieValue: () => string | null;
};

type SupporterDeviceRequestInput = {
  method: string;
};

export type SupporterDeviceResponse = {
  status: 200 | 401 | 405 | 500;
  body: {
    hasSupporterDeviceGrace: boolean;
    error?: string;
  };
  cookieAction: "set" | "clear" | "none";
  cookieValue?: string;
};

export const createSupporterDeviceHandler =
  (deps: SupporterDeviceDeps) =>
  async (input: SupporterDeviceRequestInput): Promise<SupporterDeviceResponse> => {
    if (input.method !== "POST") {
      return {
        status: 405,
        body: { hasSupporterDeviceGrace: false, error: "Method not allowed" },
        cookieAction: "none",
      };
    }

    const clerkUserId = await deps.getAuthUserId();
    if (!clerkUserId) {
      return {
        status: 401,
        body: { hasSupporterDeviceGrace: false, error: "Unauthorized" },
        cookieAction: "none",
      };
    }

    const isAdmin = deps.isAdminClerkUserId(clerkUserId);
    const user = isAdmin ? null : await deps.findUserByClerkId(clerkUserId);
    const hasSupporterAccess = isAdmin || isEffectivelySupporter(user);

    if (!hasSupporterAccess) {
      return {
        status: 200,
        body: { hasSupporterDeviceGrace: false },
        cookieAction: "clear",
      };
    }

    const cookieValue = deps.createCookieValue();
    if (!cookieValue) {
      return {
        status: 500,
        body: {
          hasSupporterDeviceGrace: false,
          error: "Supporter device grace is misconfigured.",
        },
        cookieAction: "none",
      };
    }

    return {
      status: 200,
      body: { hasSupporterDeviceGrace: true },
      cookieAction: "set",
      cookieValue,
    };
  };
