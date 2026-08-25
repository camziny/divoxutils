import { NextApiRequest, NextApiResponse } from "next";
import {
  type UserCharactersByUserIdDeps,
  handleUserCharactersByUserIdApi,
} from "@/server/userCharactersByUserIdApi";

type UserCharactersByUserIdHandlerDeps = UserCharactersByUserIdDeps & {
  getAuthUserId?: (req: NextApiRequest) => string | null;
  isAdminClerkUserId?: (clerkUserId: string | null) => boolean;
};

export const createUserCharactersByUserIdHandler =
  (deps: UserCharactersByUserIdHandlerDeps) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const userId =
      typeof req.query.userId === "string" ? req.query.userId : null;
    const viewerClerkUserId = deps.getAuthUserId?.(req) ?? null;

    const result = await handleUserCharactersByUserIdApi(
      {
        method: req.method ?? "",
        userId,
        viewerClerkUserId,
        viewerIsAdmin: deps.isAdminClerkUserId?.(viewerClerkUserId) ?? false,
      },
      deps
    );

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    if (result.bodyType === "text") {
      return res.status(result.status).end(result.body);
    }

    return res.status(result.status).json(result.body);
  };
