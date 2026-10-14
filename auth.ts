import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { resolveGoogleUser } from "@/lib/auth/google-account";
import { logAuthFailure } from "@/lib/auth/logging";
import { db } from "@/lib/db";
import { isSessionVersionCurrent } from "@/lib/auth/session-version";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret);
if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error(
    "Set both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET for Google OAuth.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
    ...(googleOAuthConfigured
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      try {
        return (await resolveGoogleUser(profile ?? {})) !== null;
      } catch (error) {
        logAuthFailure("Google account resolution", error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google") {
        const email =
          typeof profile?.email === "string"
            ? profile.email.trim().toLowerCase()
            : "";
        const googleUser = email
          ? await db.user.findUnique({
              where: { email },
              select: {
                id: true,
                disabledAt: true,
                sessionVersion: true,
              },
            })
          : null;

        return {
          ...token,
          sub:
            googleUser && googleUser.disabledAt === null
              ? googleUser.id
              : undefined,
          sessionVersion:
            googleUser && googleUser.disabledAt === null
              ? googleUser.sessionVersion
              : undefined,
          ...(token.iat === undefined ? {} : { iat: token.iat }),
          ...(token.exp === undefined ? {} : { exp: token.exp }),
          ...(token.jti === undefined ? {} : { jti: token.jti }),
        };
      }

      return {
        sub: user?.id ?? token.sub,
        ...(typeof user?.sessionVersion === "number"
          ? { sessionVersion: user.sessionVersion }
          : typeof token.sessionVersion === "number"
            ? { sessionVersion: token.sessionVersion }
            : {}),
        ...(token.iat === undefined ? {} : { iat: token.iat }),
        ...(token.exp === undefined ? {} : { exp: token.exp }),
        ...(token.jti === undefined ? {} : { jti: token.jti }),
      };
    },
    async session({ session, token }) {
      if (session.user && !token.sub) {
        session.user.id = "";
        session.user.name = "";
        session.user.email = "";
        session.user.role = null;
        session.user.image = null;
      } else if (session.user && token.sub) {
        try {
          const user = await db.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              disabledAt: true,
              sessionVersion: true,
            },
          });
          if (
            isSessionVersionCurrent(
              typeof token.sessionVersion === "number"
                ? token.sessionVersion
                : undefined,
              user,
            ) &&
            user
          ) {
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
