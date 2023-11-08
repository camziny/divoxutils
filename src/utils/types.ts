import { NextApiRequest } from "next";

export interface AuthenticatedRequest extends NextApiRequest {
  user: any;
  session: any;
}
