"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// The app is dark-only for now — `dark` is hardcoded on <html> and there is no
// theme provider to read, so the toaster is told directly rather than through
// `next-themes`. Swap this for the hook when light mode ships.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      // Sonner gates the per-type colours behind this — the `--success-*`
      // variables below are only read when rich colours are on.
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // `richColors` above swaps in sonner's own palette for every typed
          // toast, so each type is pointed back at a project token instead:
          // the Resolved green, the Open amber, and the destructive red the
          // rest of the app already uses. Backgrounds are a low-alpha tint of
          // the popover so the coloured text keeps its contrast.
          "--success-bg": "color-mix(in oklab, var(--color-status-resolved) 12%, var(--popover))",
          "--success-text": "var(--color-status-resolved)",
          "--success-border": "color-mix(in oklab, var(--color-status-resolved) 30%, transparent)",

          "--error-bg": "color-mix(in oklab, var(--destructive) 12%, var(--popover))",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in oklab, var(--destructive) 30%, transparent)",

          "--warning-bg": "color-mix(in oklab, var(--color-status-open) 12%, var(--popover))",
          "--warning-text": "var(--color-status-open)",
          "--warning-border": "color-mix(in oklab, var(--color-status-open) 30%, transparent)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
