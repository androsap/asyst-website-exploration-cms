import type { NextAuthConfig } from "next-auth";

// Konfigurasi ringan (tanpa Prisma/bcrypt) yang aman dipakai di proxy.ts.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
