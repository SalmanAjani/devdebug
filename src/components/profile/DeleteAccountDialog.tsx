"use client";

import { useActionState } from "react";
import { TriangleAlert } from "lucide-react";

import { deleteAccount, type DeleteAccountState } from "@/actions/profile";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const EMPTY_STATE: DeleteAccountState = {};

/** Trigger plus confirmation for deleting the account. */
export function DeleteAccountDialog() {
  const [state, formAction] = useActionState(deleteAccount, EMPTY_STATE);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="lg" />}>
        Delete account
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and everything in it. It
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.error && <FormAlert>{state.error}</FormAlert>}

        {/*
          A form rather than an onClick: deletion is a mutation, and the action
          finishes by signing the user out, which is a redirect the browser has
          to follow.
        */}
        <form action={formAction}>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg">Cancel</AlertDialogCancel>
            <SubmitButton
              variant="destructive"
              size="lg"
              className="w-full sm:w-auto"
              pendingLabel="Deleting..."
            >
              Delete account
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
