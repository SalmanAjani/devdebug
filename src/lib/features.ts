/**
 * Feature flags read from the environment.
 *
 * Server-side only. None of these may become `NEXT_PUBLIC_` — a flag the
 * browser can read is a flag the browser can be lied about, and an unprefixed
 * variable reads as `undefined` in a client bundle anyway. Client components
 * take what they need as a prop from a server component.
 */

/**
 * Whether signup issues a verification link and sign-in requires one.
 *
 * Off is the escape hatch for environments without a verified Resend domain:
 * `onboarding@resend.dev` only delivers to the address that owns the Resend
 * account, so every other signup would create an account nobody can sign into.
 *
 * Defaults to on, and only the exact string `"false"` turns it off. An unset or
 * misspelled variable has to fail closed — the alternative is a typo silently
 * disabling verification in production.
 */
export function isEmailVerificationEnabled(): boolean {
  return process.env.EMAIL_VERIFICATION_ENABLED?.trim().toLowerCase() !== "false";
}
