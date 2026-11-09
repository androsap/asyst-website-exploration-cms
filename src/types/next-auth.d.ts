import type { DefaultSession } from "next-auth";

// Role & izin tidak disimpan di JWT; selalu dibaca dari DB per request (src/server/session.ts),
// sehingga perubahan di Manajemen Role langsung berlaku tanpa login ulang.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
  }
}
