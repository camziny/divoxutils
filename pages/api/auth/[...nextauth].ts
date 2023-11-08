import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Session } from "next-auth";

interface MySession extends Session {
  user: {
    id: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}
