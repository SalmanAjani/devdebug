import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { EmailUnverifiedError } from "@/lib/auth-errors";
import { isEmailVerificationEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";
import authConfig from "@/auth.config";

/**
 * Full auth config — Node runtime only. Anything edge-facing imports
 * `auth.config.ts` instead, since the Prisma adapter cannot run there.
 *
 * The adapter still writes the OAuth account and user rows; `jwt` only decides
 * where the session itself is stored, and it has to be `jwt` because the proxy
 * reads the session without a database — and because the Credentials provider
 * does not work with database sessions at all.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Spread first so `providers` below wins: the edge copy only carries a
  // placeholder for Credentials, and this is where the real one lands.
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);

        // Malformed input is a failed sign-in, not a 500.
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            emailVerified: true,
          },
        });

        // No row, or a GitHub-only account with a null password — either way
        // there is nothing to compare against, so refuse rather than let an
        // empty password through.
        if (!user?.password) return null;

        if (!(await compare(password, user.password))) return null;

        // Only after the password checks out, so this never becomes a way to
        // ask whether an address is registered. Skipped entirely when the flag
        // is off, which lets accounts left unverified from an earlier run in
        // still sign in.
        if (isEmailVerificationEnabled() && !user.emailVerified) {
          throw new EmailUnverifiedError();
        }

        // Never return the hash: whatever comes back here feeds the JWT.
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
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
});
