"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/ErrorState";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Catches failures inside the dashboard layout's children — a dropped Neon
 * connection on the entries query being the likely one. Sits inside the
 * layout, so the sidebar and topbar stay put and only the content area swaps.
 *
 * Errors thrown by (dashboard)/layout.tsx itself bubble past this boundary to
 * src/app/error.tsx, which is why both exist.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack in production.
    console.error("Dashboard route error:", error.digest ?? error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ErrorState
        title="Couldn't load your entries"
        description="Something went wrong reaching the database. Your data is safe — retrying usually clears it."
        onRetry={reset}
      />
    </div>
  );
}
