import type { Metadata } from "next";
import Link from "next/link";

import { FormAlert } from "@/components/auth/FormAlert";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Set a new password · DevDebug",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Lands the reset link.
 *
 * The token is only checked for existence here and handed to the form — a page
 * render is a GET, and redeeming a token is a mutation, so the consuming has to
 * wait for the submit. Nor does a session redirect belong on this page: the
 * token is the authority, and someone signed in on one account may legitimately
 * be resetting another.
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </header>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        // Some mail clients wrap long urls, so a truncated link looks the same
        // as a forged one from here.
        <div className="flex flex-col gap-4">
          <FormAlert>
            That reset link is incomplete. Request a new one and open it directly from
            the email.
          </FormAlert>

          {/* Styled as a button, but it navigates — so it stays a real link. */}
          <Link
            href="/forgot-password"
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Request a new link
          </Link>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
