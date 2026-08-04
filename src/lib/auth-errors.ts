import { CredentialsSignin } from "next-auth";

/** Travels back to the client in `?code=`, so it must stay non-sensitive. */
export const EMAIL_UNVERIFIED_CODE = "email_unverified";

/**
 * Thrown from `authorize` when the password was correct but the address has not
 * been verified yet.
 *
 * Subclassing `CredentialsSignin` is what keeps this distinguishable: NextAuth
 * lets that error type through untouched, so the `code` survives to the caller.
 * Anything else thrown in `authorize` gets wrapped in a `CallbackRouteError`
 * and loses its identity.
 *
 * Telling this apart from a wrong password is a deliberate exception to the
 * usual "never confirm an account exists" rule — the caller already proved they
 * know the password, so there is nothing left to leak.
 */
export class EmailUnverifiedError extends CredentialsSignin {
  code = EMAIL_UNVERIFIED_CODE;
}
