import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password · DevDebug",
};

export default async function ForgotPasswordPage() {
  // Someone with a live session can change their password without a link.
  if (await auth()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a link to set a new one.
        </p>
      </header>

      <ForgotPasswordForm />

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
