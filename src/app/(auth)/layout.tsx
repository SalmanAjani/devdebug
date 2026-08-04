import Link from "next/link";
import { Bug } from "lucide-react";

/**
 * Centred single-column shell for sign-in and register.
 *
 * Deliberately outside the dashboard group: there is no sidebar and no session
 * to read, so none of that layout's queries should run here.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
          <Bug className="size-4" />
        </span>
        <span className="text-lg font-semibold">DevDebug</span>
      </Link>

      <main className="w-full max-w-sm">{children}</main>

      <p className="text-center text-xs text-muted-foreground">
        Never solve the same bug twice.
      </p>
    </div>
  );
}
