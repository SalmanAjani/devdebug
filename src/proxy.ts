import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

// Edge-safe instance: the proxy only reads the JWT, so it must not pull in the
// adapter from `auth.ts`.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  if (req.auth) return NextResponse.next();

  // NextAuth's built-in sign-in page.
  return NextResponse.redirect(new URL("/api/auth/signin", req.nextUrl.origin));
});

export const config = {
  // `:path*` matches zero or more segments, so this covers /dashboard itself.
  matcher: ["/dashboard/:path*"],
};
