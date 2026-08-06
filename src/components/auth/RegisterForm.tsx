"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerSchema } from "@/lib/validations/auth";

type FieldErrors = Record<string, string[] | undefined>;

interface RegisterResponse {
  success: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    // The same schema the route handler runs, so mismatched passwords and bad
    // emails are caught before a request goes out. The server still re-checks.
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      // Read defensively: a throttled request is still a real answer, and
      // letting a decode failure fall through to the catch would report it as
      // "could not reach the server", which is both wrong and retryable-looking.
      const result: RegisterResponse = await response.json().catch(() => ({
        success: false,
      }));

      if (!response.ok || !result.success) {
        setError(
          result.error ??
            (response.status === 429
              ? "Too many attempts. Please try again later."
              : "Could not create the account. Please try again.")
        );
        setFieldErrors(result.fieldErrors ?? {});
        setPending(false);
        return;
      }

      // Registration does not sign the user in — it cannot, until the address
      // is verified. The banner on the sign-in page points them at their inbox.
      // `pending` stays true on purpose so the button does not flick back to
      // its idle label while the router navigates away.
      router.push("/sign-in?registered=1");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && <FormAlert>{error}</FormAlert>}

      <FieldGroup className="gap-4">
        <Field data-invalid={!!fieldErrors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Jane Developer"
            required
            disabled={pending}
            aria-invalid={!!fieldErrors.name}
            className="h-9"
          />
          <FieldError errors={fieldErrors.name?.map((message) => ({ message }))} />
        </Field>

        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={pending}
            aria-invalid={!!fieldErrors.email}
            className="h-9"
          />
          <FieldError errors={fieldErrors.email?.map((message) => ({ message }))} />
        </Field>

        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            disabled={pending}
            aria-invalid={!!fieldErrors.password}
            className="h-9"
          />
          <FieldError errors={fieldErrors.password?.map((message) => ({ message }))} />
        </Field>

        <Field data-invalid={!!fieldErrors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            disabled={pending}
            aria-invalid={!!fieldErrors.confirmPassword}
            className="h-9"
          />
          <FieldError
            errors={fieldErrors.confirmPassword?.map((message) => ({ message }))}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
