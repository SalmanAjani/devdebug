import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";

/**
 * Full auth config — Node runtime only. Anything edge-facing imports
 * `auth.config.ts` instead, since the Prisma adapter cannot run there.
 *
 * The adapter still writes the OAuth account and user rows; `jwt` only decides
 * where the session itself is stored, and it has to be `jwt` because the proxy
 * reads the session without a database.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    // `user` is only set on the sign-in pass; every later call re-reads the token.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
    // The proxy sends users to the sign-in page without a `callbackUrl`, so
    // NextAuth falls back to the base url. Land those on the dashboard instead.
    redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }

      // Everything below is NextAuth's own default: resolve relative urls,
      // allow same-origin absolute ones, and refuse to leave the site.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;
    },
  },
  ...authConfig,
});
