import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Lapis pertama proteksi. Setiap page & server action tetap memeriksa session sendiri
// (lihat src/server/session.ts), jadi proxy bukan satu-satunya penjaga.
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = new URL("/login", req.nextUrl);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin/users") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin?forbidden=1", req.nextUrl));
    }
  }

  if (pathname === "/login" && user && !req.nextUrl.searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
