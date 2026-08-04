import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account · DevDebug",
};

export default async function RegisterPage() {
  // Signing up while already signed in would just orphan the current session.
  if (await auth()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Start capturing bugs, root causes and fixes.
        </p>
      </header>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
