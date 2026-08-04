import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FormAlert } from "@/components/auth/FormAlert";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { SignInForm } from "@/components/auth/SignInForm";
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

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    registered?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, error, registered } = await searchParams;

  // Already signed in — no reason to show the form again.
  if (await auth()) {
    redirect(callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard");
  }

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Could not sign you in. Please try again.")
    : undefined;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Welcome</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your debugging journal.
        </p>
      </header>

      {registered && (
        <FormAlert variant="success">
          Account created. Sign in to get started.
        </FormAlert>
      )}

      <SignInForm callbackUrl={callbackUrl} initialError={errorMessage} />

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
