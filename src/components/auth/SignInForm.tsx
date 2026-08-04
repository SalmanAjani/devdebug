"use client";

import { useActionState } from "react";

import {
  resendVerificationEmail,
  signInWithCredentials,
  type AuthFormState,
  type ResendVerificationState,
} from "@/actions/auth";
import { FormAlert } from "@/components/auth/FormAlert";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMPTY_STATE: AuthFormState = { attempt: 0 };
const EMPTY_RESEND_STATE: ResendVerificationState = { attempt: 0 };

/** A single banner above the fields. Never more than one at a time. */
export interface SignInNotice {
  variant: "error" | "success";
  message: string;
}

interface SignInFormProps {
  /** Path the proxy bounced the user off, forwarded through a hidden input. */
  callbackUrl?: string;
  /** What the url had to say on arrival — registration, verification, or an OAuth error. */
  notice?: SignInNotice;
}

export function SignInForm({ callbackUrl, notice }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInWithCredentials,
    EMPTY_STATE
  );
  const [resendState, resendAction] = useActionState(
    resendVerificationEmail,
    EMPTY_RESEND_STATE
  );

  // A resend result stops counting the moment "Sign in" is pressed again — at
  // that point it describes a previous attempt, and the new outcome owns the
  // banner instead.
  const resendIsCurrent = resendState.attempt === state.attempt;
  const resendMessage = resendIsCurrent
    ? (resendState.message ?? resendState.error)
    : undefined;

  // Newest wins: this attempt's resend result, then its sign-in outcome, then
  // whatever the url said when the page loaded. The url notice is the first
  // thing to go stale, so it is the first to be replaced.
  const shownNotice: SignInNotice | undefined = resendMessage
    ? {
        variant: resendState.message ? "success" : "error",
        message: resendMessage,
      }
    : state.error
      ? { variant: "error", message: state.error }
      : notice;

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {shownNotice && (
          <FormAlert variant={shownNotice.variant}>{shownNotice.message}</FormAlert>
        )}

        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}

        <FieldGroup className="gap-4">
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

          <Field data-invalid={!!state.fieldErrors?.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={isPending}
              aria-invalid={!!state.fieldErrors?.password}
              className="h-9"
            />
            <FieldError
              errors={state.fieldErrors?.password?.map((message) => ({ message }))}
            />
          </Field>
        </FieldGroup>

        <SubmitButton size="lg" pendingLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      {/* Only after a correct password, so this cannot be used to probe addresses. */}
      {state.unverifiedEmail && (
        <ResendVerificationForm
          action={resendAction}
          email={state.unverifiedEmail}
          attempt={state.attempt}
          sent={resendIsCurrent && !!resendState.message}
        />
      )}
    </div>
  );
}
