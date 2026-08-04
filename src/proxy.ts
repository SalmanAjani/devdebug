import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

// Edge-safe instance: the proxy only reads the JWT, so it must not pull in the
// adapter from `auth.ts`.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  if (req.auth) return NextResponse.next();

  const signInUrl = new URL("/sign-in", req.nextUrl.origin);

  // Send the user back where they were headed once they are signed in. Only
  // the path and query travel, so this can never become an open redirect.
  signInUrl.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`
  );

  return NextResponse.redirect(signInUrl);
});

export const config = {
  // `:path*` matches zero or more segments, so this covers /dashboard itself.
  matcher: ["/dashboard/:path*", "/collections/:path*", "/pinned/:path*", "/profile/:path*"],
};
