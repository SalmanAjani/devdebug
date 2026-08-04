"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  /** Replaces the label while the action is in flight. */
  pendingLabel?: string;
}

/**
 * Submit button wired to its own form's pending state.
 *
 * `useFormStatus` only reports on the nearest parent form, which is the point:
 * the sign-in page has two forms, and pressing GitHub should not put the
 * credentials button into a loading state.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={cn("w-full", className)}
      {...props}
    >
      {pending && <Loader2 className="animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
