import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** The database user id, carried through the JWT. */
      id: string;
      // Spreading the default keeps name/email/image on the type — declaring
      // `user` here would otherwise replace them outright.
    } & DefaultSession["user"];
  }
}

// `next-auth/jwt` only re-exports this module, and declaration merging does not
// travel through a re-export — augmenting the original is what actually lands.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
  }
}
