"use client";

import { useActionState, useState } from "react";

import { changePassword, type ChangePasswordState } from "@/actions/profile";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMPTY_STATE: ChangePasswordState = {};

/**
 * The password form, split out so the dialog can remount it.
 *
 * `useActionState` keeps its result for the life of the component, so without a
 * fresh mount per open the dialog would reopen showing the last submit's error
 * or success banner.
 */
function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, EMPTY_STATE);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert variant="success">Your password has been changed.</FormAlert>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="lg" />}>
            Done
          </DialogClose>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <FieldGroup className="gap-4">
        <Field data-invalid={!!state.fieldErrors?.currentPassword}>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-invalid={!!state.fieldErrors?.currentPassword}
            className="h-9"
          />
          <FieldError
            errors={state.fieldErrors?.currentPassword?.map((message) => ({ message }))}
          />
        </Field>

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
            placeholder="Re-enter your new password"
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

      <DialogFooter>
        <DialogClose
          render={<Button variant="outline" size="lg" disabled={isPending} />}
        >
          Cancel
        </DialogClose>
        <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel="Saving...">
          Change password
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

/** Trigger plus dialog for changing the password. Only rendered for accounts that have one. */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        Change password
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password, then choose a new one.
          </DialogDescription>
        </DialogHeader>

        {/* Keyed on `open` so every visit starts from a blank form. */}
        <ChangePasswordForm key={String(open)} />
      </DialogContent>
    </Dialog>
  );
}
