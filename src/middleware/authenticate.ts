import { NextApiResponse } from "next";
import { verifyToken } from "../utils/auth";
import { getCookie } from "../utils/cookies";
import { AuthenticatedRequest } from "@/utils/types";

const authenticate =
  (handler: any) => async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = getCookie(req, "token");

      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: "Token verification failed" });
      }

      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: "Error authenticating" });
    }
  };

export default authenticate;
