import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the auth config.
 *
 * The proxy runs before every matched request, so it can only import code that
 * works outside Node. Prisma does not, which is why the adapter lives in
 * `auth.ts` and never in here.
 *
 * @see https://authjs.dev/getting-started/installation#edge-compatibility
 */
export default {
  // Both instances need these: `auth.ts` spreads this config, and the proxy
  // builds its own NextAuth from it. A mismatch would send users to NextAuth's
  // built-in page from one path and the custom one from the other.
  pages: {
    signIn: "/sign-in",
    // Credentials failures surface as `?error=CredentialsSignin` on the sign-in
    // page rather than NextAuth's own error screen.
    error: "/sign-in",
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Placeholder only. Checking a password needs Prisma and bcrypt, neither
      // of which runs on the edge, so `auth.ts` replaces this whole provider.
      // Listing it here still gives the proxy the same provider set as the
      // Node instance, and rejecting every sign-in is the safe way to fail if
      // this copy is ever the one that runs.
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
