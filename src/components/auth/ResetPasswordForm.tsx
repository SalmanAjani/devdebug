"use client";

import { useActionState } from "react";
import Link from "next/link";

import { resetPassword, type ResetPasswordState } from "@/actions/password-reset";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMPTY_STATE: ResetPasswordState = {};

interface ResetPasswordFormProps {
  /** Raw token from the link, carried into the action through a hidden input. */
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(resetPassword, EMPTY_STATE);

  // A spent or forged token cannot be retried, so the fields go away and the
  // only thing left is the way to get a working link.
  if (state.linkDead) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert>{state.error}</FormAlert>

        {/* Styled as a button, but it navigates — so it stays a real link. */}
        <Link
          href="/forgot-password"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <input type="hidden" name="token" value={token} />

      <FieldGroup className="gap-4">
        <Field data-invalid={!!state.fieldErrors?.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            disabled={isPending}
            aria-invalid={!!state.fieldErrors?.password}
            className="h-9"
          />
          <FieldError
            errors={state.fieldErrors?.password?.map((message) => ({ message }))}
          />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            disabled={isPending}
            aria-invalid={!!state.fieldErrors?.confirmPassword}
            className="h-9"
          />
          <FieldError
            errors={state.fieldErrors?.confirmPassword?.map((message) => ({ message }))}
          />
        </Field>
      </FieldGroup>

      <SubmitButton size="lg" pendingLabel="Saving...">
        Set new password
      </SubmitButton>
    </form>
  );
}
