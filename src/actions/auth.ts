"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { EMAIL_UNVERIFIED_CODE } from "@/lib/auth-errors";
import { sendVerificationEmail } from "@/lib/email";
import { isEmailVerificationEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { safeRedirect } from "@/lib/redirects";
import { signInSchema } from "@/lib/validations/auth";
import { createVerificationToken, isWithinResendCooldown } from "@/lib/verification";

/** What `useActionState` holds between submits. Empty means "nothing failed yet". */
export interface AuthFormState {
  /** Form-level message, rendered above the fields. */
  error?: string;
  /** Per-field messages from the Zod parse, keyed by input name. */
  fieldErrors?: Record<string, string[] | undefined>;
  /** Set when the only thing wrong was verification — drives the resend button. */
  unverifiedEmail?: string;
  /**
   * Bumped on every submit.
   *
   * The resend action echoes it back, which is the only way the form can tell a
   * resend result that belongs to this attempt from one left over before the
   * user pressed "Sign in" again. Without it the two states are independent and
   * both would claim the banner.
   */
  attempt: number;
}

/**
 * Email/password sign-in.
 *
 * `signIn` reports a bad password by throwing `CredentialsSignin`, and reports
 * success by throwing the Next redirect — so the catch has to let anything that
 * is not an `AuthError` continue on its way.
 */
export async function signInWithCredentials(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const attempt = prevState.attempt + 1;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      attempt,
      error: "Enter your email and password.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // After the parse, so a malformed submit does not spend an attempt, and
  // because the email is half the key. Before `signIn`, so a throttled caller
  // never reaches the bcrypt comparison — that cost is the point of the limit.
  const rateLimit = await checkAuthRateLimit("signIn", parsed.data.email);

  if (!rateLimit.success) {
    return { attempt, error: rateLimitMessage(rateLimit.reset) };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      // The password was right and only verification is missing, so offer the
      // way out instead of the dead-end message below.
      if (error.code === EMAIL_UNVERIFIED_CODE) {
        return {
          attempt,
          error: "Verify your email address before signing in.",
          unverifiedEmail: parsed.data.email,
        };
      }

      // Deliberately the same message for "no such account" and "wrong
      // password" — telling them apart is an email-enumeration oracle.
      return { attempt, error: "Invalid email or password." };
    }

    if (error instanceof AuthError) {
      return { attempt, error: "Something went wrong signing you in. Please try again." };
    }

    throw error;
  }

  return { attempt };
}

/** What the resend button shows after a submit. */
export interface ResendVerificationState {
  message?: string;
  error?: string;
  /** Echo of the `AuthFormState.attempt` the button was rendered for. */
  attempt: number;
}

/**
 * Sends a fresh verification link.
 *
 * Rate limited to one email per address per minute. That cap lives in the
 * database rather than in memory on purpose — serverless instances do not share
 * a process, so an in-memory counter would reset on every cold start.
 *
 * The response never varies with whether the address exists or is already
 * verified. Reaching this action normally requires a correct password, but a
 * Server Action is a public endpoint and can be called directly.
 */
export async function resendVerificationEmail(
  _prevState: ResendVerificationState,
  formData: FormData
): Promise<ResendVerificationState> {
  // Echoed straight back so the form can tell whether this result still belongs
  // to the sign-in attempt the button was rendered for.
  const attempt = Number(formData.get("attempt")) || 0;

  const sent = {
    attempt,
    message: "A new verification link has been sent.",
  };

  // With verification off nothing renders the button, but the action is still a
  // public endpoint — so it refuses here rather than trusting the UI, and says
  // the same thing it always says.
  if (!isEmailVerificationEnabled()) return sent;

  const parsed = z.email().toLowerCase().safeParse(formData.get("email"));

  if (!parsed.success) return sent;

  const email = parsed.data;

  // Safe to report, unlike everything else here: it describes how often this
  // caller has asked, which they already know, and says nothing about whether
  // the address is registered. The uniform `sent` response above still covers
  // that question on every other path.
  const rateLimit = await checkAuthRateLimit("resendVerification", email);

  if (!rateLimit.success) {
    return { attempt, error: rateLimitMessage(rateLimit.reset) };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    });

    // Nothing to do, but say the same thing as a real send: a different message
    // here would answer "is this address registered?" for anyone who asks.
    // The cooldown is silent for the same reason — someone throttled by it was
    // sent a working link less than a minute ago regardless.
    if (!user || user.emailVerified || (await isWithinResendCooldown(email))) {
      return sent;
    }

    const token = await createVerificationToken(email);
    await sendVerificationEmail({ to: email, name: user.name, token });

    return sent;
  } catch (error) {
    console.error("Resending the verification email failed for", email, error);
    return { attempt, error: "Could not send the email. Please try again." };
  }
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
