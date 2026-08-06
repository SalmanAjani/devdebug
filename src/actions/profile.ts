"use server";

import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { signOut } from "@/auth";
import { deleteUserAccount, updateUserPassword } from "@/lib/account";
import { requireUserId } from "@/lib/db/user";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";

/** What the change-password form holds between submits. */
export interface ChangePasswordState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * Changes the signed-in user's password.
 *
 * Nothing here is told apart by email — the account comes from the session, so
 * this action can only ever touch the caller's own row. The current password is
 * still required: a session cookie proves the browser signed in once, not that
 * the person using it now knows the password.
 */
export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { currentPassword, password } = parsed.data;

  // Outside the try: this redirects by throwing when there is no session, and a
  // catch would turn a signed-out request into a generic error message.
  const userId = await requireUserId();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true },
    });

    // A GitHub-only account has no password to replace. The dialog is hidden
    // for those users, but a Server Action is a public endpoint — so it refuses
    // here rather than trusting the UI.
    if (!user?.password) {
      return { error: "This account signs in with GitHub and has no password." };
    }

    if (!(await compare(currentPassword, user.password))) {
      return { fieldErrors: { currentPassword: ["Current password is incorrect"] } };
    }

    // False means the row vanished mid-submit. Same message as any other
    // failure — the user's next request will bounce them to sign-in anyway.
    if (!(await updateUserPassword(userId, user.email, await hashPassword(password)))) {
      return { error: "Could not change your password. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Changing the password failed for user", userId, error);
    return { error: "Could not change your password. Please try again." };
  }
}

/** What the delete-account confirmation holds. Only ever set when the delete failed. */
export interface DeleteAccountState {
  error?: string;
}

/**
 * Deletes the signed-in user's account, then signs them out.
 *
 * Irreversible, and it takes every entry and collection with it — the dialog in
 * front of it is the only thing standing between a stray click and that.
 */
export async function deleteAccount(
  _prevState: DeleteAccountState,
  _formData: FormData
): Promise<DeleteAccountState> {
  const userId = await requireUserId();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user) {
      await deleteUserAccount(userId, user.email);
    }
  } catch (error) {
    console.error("Deleting the account failed for user", userId, error);
    return { error: "Could not delete your account. Please try again." };
  }

  // The layout's cached user and counts now point at a row that is gone.
  revalidatePath("/", "layout");

  // Outside the try for the same reason as `requireUserId`: `signOut` finishes
  // by throwing the redirect, and catching it would report a phantom failure
  // for an account that is already deleted.
  await signOut({ redirectTo: "/sign-in" });

  return {};
}
