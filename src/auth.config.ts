import GitHub from "next-auth/providers/github";
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
  providers: [GitHub],
} satisfies NextAuthConfig;
