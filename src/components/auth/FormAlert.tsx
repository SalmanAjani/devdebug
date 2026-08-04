import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

interface FormAlertProps {
  variant?: "error" | "success";
  children: React.ReactNode;
}

/** Form-level banner above the fields. Errors announce themselves to screen readers. */
export function FormAlert({ variant = "error", children }: FormAlertProps) {
  const Icon = variant === "error" ? CircleAlert : CircleCheck;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-status-resolved/30 bg-status-resolved/10 text-status-resolved"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
