"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  isWithinPasswordResetCooldown,
  resetUserPassword,
  revokePasswordResetTokens,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";

/** What the "forgot password" form holds between submits. */
export interface ForgotPasswordState {
  /** The request was accepted. Says nothing about whether an email went out. */
  sent?: boolean;
  /** Only ever set when something on our side broke. */
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * Emails a reset link.
 *
 * The result never varies with whether the address is registered, is a
 * GitHub-only account with no password to reset, or was throttled — all four
 * paths return the same `sent`. Anything else turns this public endpoint into a
 * way to enumerate who has an account here.
 *
 * The cooldown is silent for the same reason it is in the verification resend:
 * someone it throttles was sent a working link less than a minute ago anyway.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  // A malformed address is a formatting problem, not an answer to "does this
  // account exist" — safe to report.
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, password: true },
    });

    // No account, or an OAuth-only one: there is no password to reset, and
    // sending "you have no password" to an address would answer both questions
    // at once.
    if (!user?.password || (await isWithinPasswordResetCooldown(email))) {
      return { sent: true };
    }

    const token = await createPasswordResetToken(email);

    try {
      await sendPasswordResetEmail({ to: email, name: user.name, token });
    } catch (error) {
      // The token is what the cooldown is measured from, so an undelivered one
      // would make the user's retry return `sent` and do nothing for a minute.
      await revokePasswordResetTokens(email);
      throw error;
    }

    return { sent: true };
  } catch (error) {
    console.error("Sending the password reset email failed for", email, error);
    return { error: "Could not send the email. Please try again." };
  }
}

/** What the reset form holds between submits. */
export interface ResetPasswordState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** The link itself is spent or forged — the form is a dead end, offer a fresh one. */
  linkDead?: boolean;
}

const DEAD_LINK_MESSAGES: Record<"invalid" | "expired", string> = {
  expired: "That reset link has expired.",
  invalid: "That reset link is not valid. It may have already been used.",
};

/**
 * Sets a new password from a reset link.
 *
 * The token is consumed before the password is written, so a link is spent even
 * if the write then fails. That trades a rare "request another link" against
 * leaving a redeemed link live, which is the wrong way round to be wrong.
 */
export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { token, password } = parsed.data;

  try {
    const result = await consumePasswordResetToken(token);

    if (!result.ok) {
      return { error: DEAD_LINK_MESSAGES[result.reason], linkDead: true };
    }

    // The token was valid but the account is gone, so there is nothing to
    // write. Same message as a forged link — the user can do nothing with the
    // difference, and it is not ours to explain.
    if (!(await resetUserPassword(result.email, await hashPassword(password)))) {
      return { error: DEAD_LINK_MESSAGES.invalid, linkDead: true };
    }
  } catch (error) {
    console.error("Password reset failed:", error);
    return { error: "Could not reset your password. Please try again." };
  }

  // Outside the try: `redirect` works by throwing, and a catch would swallow it.
  redirect("/sign-in?reset=success");
}
