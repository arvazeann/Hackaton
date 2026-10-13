import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { logAuthFailure } from "@/lib/auth/logging";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      return {
        sub: user?.id ?? token.sub,
        ...(token.iat === undefined ? {} : { iat: token.iat }),
        ...(token.exp === undefined ? {} : { exp: token.exp }),
        ...(token.jti === undefined ? {} : { jti: token.jti }),
      };
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          const user = await db.user.findUnique({
            where: { id: token.sub },
            select: { id: true, name: true, email: true, role: true },
          });
          if (user) {
            session.user.id = user.id;
            session.user.name = user.name;
            session.user.email = user.email;
            session.user.image = null;
            session.user.role = user.role;
          } else {
            session.user.id = "";
            session.user.name = "";
            session.user.email = "";
            session.user.role = null;
            session.user.image = null;
          }
        } catch (error) {
          logAuthFailure("Session user lookup", error);
          session.user.id = "";
          session.user.name = "";
          session.user.email = "";
          session.user.role = null;
          session.user.image = null;
        }
      }
      return session;
    },
  },
});
