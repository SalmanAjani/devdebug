import { z } from "zod";

/** Long enough to be worth hashing, short enough to stay under bcrypt's 72-byte input limit. */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

/**
 * Registration payload for `POST /api/auth/register`.
 *
 * Emails are lower-cased here and in `signInSchema` so the `@unique` column
 * never ends up holding two casings of the same address.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    email: z.email("Enter a valid email address").toLowerCase(),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * What the Credentials provider hands to `authorize`. Kept separate from
 * `registerSchema` — sign-in has no confirmation field, and the length rules
 * are about rejecting junk early, not about re-stating the password policy.
 */
export const signInSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

export type SignInInput = z.infer<typeof signInSchema>;

/** Address to send a reset link to. */
export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * The reset form. The token rides along in a hidden input rather than being
 * read from the url server-side — a Server Action receives form data, not the
 * page's query string.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "This reset link is missing its token"),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Changing a password from inside the account.
 *
 * Unlike the reset flow there is no token, so the current password is what
 * proves the person at the keyboard is the account holder and not someone who
 * walked up to an unlocked session.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
