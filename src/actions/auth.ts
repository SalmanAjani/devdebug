"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { signInSchema } from "@/lib/validations/auth";

/** Where sign-in lands when the request carried no usable callback. */
const DEFAULT_REDIRECT = "/dashboard";

/** What `useActionState` holds between submits. Empty means "nothing failed yet". */
export interface AuthFormState {
  /** Form-level message, rendered above the fields. */
  error?: string;
  /** Per-field messages from the Zod parse, keyed by input name. */
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * A `callbackUrl` reaches us from the proxy through a query string, so it is
 * user-controlled. Only same-site paths survive: a leading `//` or a `\` would
 * be read as another origin by the browser and turn this into an open redirect.
 */
function safeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return DEFAULT_REDIRECT;
  if (!value.startsWith("/")) return DEFAULT_REDIRECT;
  if (value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_REDIRECT;

  return value;
}

/**
 * Email/password sign-in.
 *
 * `signIn` reports a bad password by throwing `CredentialsSignin`, and reports
 * success by throwing the Next redirect — so the catch has to let anything that
 * is not an `AuthError` continue on its way.
 */
export async function signInWithCredentials(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Enter your email and password.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately the same message for "no such account" and "wrong
      // password" — telling them apart is an email-enumeration oracle.
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Invalid email or password."
            : "Something went wrong signing you in. Please try again.",
      };
    }

    throw error;
  }

  return {};
}

/** GitHub OAuth. Always redirects, so it never returns a state. */
export async function signInWithGitHub(formData: FormData): Promise<void> {
  await signIn("github", {
    redirectTo: safeRedirect(formData.get("callbackUrl")),
  });
}

/**
 * Sign out and land on the sign-in page.
 *
 * `redirectTo` is required: the `redirect` callback in `auth.ts` sends a bare
 * base url to the dashboard, and it cannot tell a sign-out apart from a
 * sign-in — without this the user would be bounced straight back through the
 * proxy and into this same page anyway, with a redundant round trip.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}
