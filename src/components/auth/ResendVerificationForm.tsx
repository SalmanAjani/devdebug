"use client";

import { SubmitButton } from "@/components/auth/SubmitButton";

interface ResendVerificationFormProps {
  /** `useActionState` dispatcher owned by `SignInForm`, which renders the result. */
  action: (formData: FormData) => void;
  /** Address the sign-in attempt used. Carried in a hidden input, re-validated server-side. */
  email: string;
  /** Sign-in attempt this button belongs to. Echoed back so a stale result can be spotted. */
  attempt: number;
  /** A link is already out for this attempt — hide the button so it cannot be queued up five times. */
  sent: boolean;
}

/**
 * Its own form rather than a second button inside the sign-in form: forms cannot
 * nest, and this needs its own action and pending state.
 *
 * The state lives in `SignInForm` so that one component decides which single
 * banner to show — two independent states would each render their own.
 */
export function ResendVerificationForm({
  action,
  email,
  attempt,
  sent,
}: ResendVerificationFormProps) {
  if (sent) return null;

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="attempt" value={attempt} />

      <SubmitButton variant="outline" pendingLabel="Sending...">
        Resend verification email
      </SubmitButton>
    </form>
  );
}
