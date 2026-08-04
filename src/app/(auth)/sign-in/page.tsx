import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { SignInForm, type SignInNotice } from "@/components/auth/SignInForm";
import { FieldSeparator } from "@/components/ui/field";

export const metadata: Metadata = {
  title: "Sign in · DevDebug",
};

/**
 * NextAuth redirects here with `?error=<code>` on a failed OAuth handshake.
 * Anything unmapped falls back to the generic message rather than leaking a
 * raw code into the UI.
 */
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthAccountNotLinked:
    "That email already has a password account. Sign in with your password instead.",
  OAuthSignin: "Could not reach GitHub. Please try again.",
  OAuthCallback: "GitHub sign-in did not complete. Please try again.",
  AccessDenied: "You do not have access to this account.",
  Configuration: "Sign-in is misconfigured. Please contact support.",
};

/**
 * Outcomes of `GET /api/auth/verify-email`, which redirects here with
 * `?verify=<outcome>` rather than rendering a page of its own.
 */
const VERIFY_MESSAGES: Record<string, SignInNotice> = {
  success: {
    variant: "success",
    message: "Email verified. Sign in to get started.",
  },
  expired: {
    variant: "error",
    message:
      "That verification link has expired. Sign in below and we will send you a new one.",
  },
  invalid: {
    variant: "error",
    message:
      "That verification link is not valid. It may have already been used — try signing in.",
  },
};

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    registered?: string;
    verify?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, error, registered, verify } = await searchParams;

  // Already signed in — no reason to show the form again.
  if (await auth()) {
    redirect(callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard");
  }

  // At most one, and the form narrows it further once the user submits. An
  // OAuth failure is the most recent thing to have happened, so it outranks a
  // verification outcome, which in turn outranks the registration confirmation.
  const notice: SignInNotice | undefined = error
    ? {
        variant: "error",
        message: ERROR_MESSAGES[error] ?? "Could not sign you in. Please try again.",
      }
    : (verify ? VERIFY_MESSAGES[verify] : undefined) ??
      (registered
        ? {
            variant: "success",
            message: "Account created. Check your inbox for a link to verify your email.",
          }
        : undefined);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Welcome</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your debugging journal.
        </p>
      </header>

      <SignInForm callbackUrl={callbackUrl} notice={notice} />

      <FieldSeparator>or</FieldSeparator>

      <GitHubSignInButton callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
