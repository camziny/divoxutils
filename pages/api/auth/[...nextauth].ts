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

export default NextAuth({
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      const mySession: MySession = session as MySession;

      if (!mySession.user) {
        mySession.user = { id: token.id as number };
      } else {
        mySession.user.id = token.id as number;
      }

      return mySession;
    },
  },
});
