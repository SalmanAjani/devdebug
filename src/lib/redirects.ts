/** Where sign-in lands when the request carried no usable callback. */
export const DEFAULT_REDIRECT = "/dashboard";

/**
 * A `callbackUrl` reaches us from the proxy through a query string, so it is
 * user-controlled. Only same-site paths survive: a leading `//` or a `\` would
 * be read as another origin by the browser and turn this into an open redirect.
 *
 * Lives here rather than in `actions/auth.ts` because that file is `"use server"`,
 * where every export has to be an async Server Action — and the sign-in page
 * needs this same rule for its already-authenticated shortcut. Two copies of it
 * drifted once already.
 */
export function safeRedirect(value: FormDataEntryValue | null | undefined): string {
  if (typeof value !== "string") return DEFAULT_REDIRECT;
  if (!value.startsWith("/")) return DEFAULT_REDIRECT;
  if (value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_REDIRECT;

  return value;
}
