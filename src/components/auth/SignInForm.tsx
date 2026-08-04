"use client";

import { useActionState } from "react";

import { signInWithCredentials, type AuthFormState } from "@/actions/auth";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMPTY_STATE: AuthFormState = {};

interface SignInFormProps {
  /** Path the proxy bounced the user off, forwarded through a hidden input. */
  callbackUrl?: string;
  /** Set when NextAuth redirected here with `?error=` instead of the action returning one. */
  initialError?: string;
}

export function SignInForm({ callbackUrl, initialError }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInWithCredentials,
    EMPTY_STATE
  );

  // The action's own result wins — once the user resubmits, a stale `?error=`
  // left in the url should stop being the thing they see.
  const error = state.error ?? initialError;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {error && <FormAlert>{error}</FormAlert>}

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
  );
}
