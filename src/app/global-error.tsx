"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/ErrorState";

import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Boundary for failures in the shell itself.
 *
 * (dashboard)/layout.tsx queries Neon for the sidebar counts, and a throw
 * there takes down the whole render — verified: a plain app/error.tsx does
 * not catch it, the request falls through to Next's built-in error page.
 * Only global-error.tsx sits high enough.
 *
 * It replaces the root layout when it renders, so it owns <html> and <body>
 * and has to pull in globals.css itself. The Geist fonts are skipped on
 * purpose — loading them here would mean a webfont request on the one path
 * where something is already broken.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack in production.
    console.error("Application error:", error.digest ?? error);
  }, [error]);

  return (
    <html lang="en" className="dark antialiased">
      <body>
        <main className="flex h-svh items-center justify-center bg-background p-6">
          <ErrorState
            title="Something went wrong"
            description="DevDebug hit an unexpected error and couldn't finish loading the page."
            onRetry={reset}
            className="border-none"
          />
        </main>
      </body>
    </html>
  );
}
