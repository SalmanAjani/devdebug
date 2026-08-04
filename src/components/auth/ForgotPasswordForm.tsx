"use client";

import { useActionState } from "react";

import { requestPasswordReset, type ForgotPasswordState } from "@/actions/password-reset";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMPTY_STATE: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, EMPTY_STATE);

  // The confirmation replaces the form rather than sitting above it: leaving a
  // filled-in field there invites a second submit that the cooldown would
  // silently drop, which reads as the button having done nothing.
  if (state.sent) {
    return (
      <FormAlert variant="success">
        A reset link has been sent to your email. The link expires in 1 hour.
      </FormAlert>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Field data-invalid={!!state.fieldErrors?.email}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
          aria-invalid={!!state.fieldErrors?.email}
          className="h-9"
        />
        <FieldError errors={state.fieldErrors?.email?.map((message) => ({ message }))} />
      </Field>

      <SubmitButton size="lg" pendingLabel="Sending...">
        Send reset link
      </SubmitButton>
    </form>
  );
}
