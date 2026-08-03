import { CircleCheck, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { EntryStatus, TechCategory } from "@/generated/prisma/enums";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  /** Full class names — Tailwind never sees classes built by concatenation. */
  className: string;
}

export const STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    icon: CircleDot,
    className: "border-status-open/30 bg-status-open/10 text-status-open",
  },
  RESOLVED: {
    label: "Resolved",
    icon: CircleCheck,
    className:
      "border-status-resolved/30 bg-status-resolved/10 text-status-resolved",
  },
} as const satisfies Record<EntryStatus, StatusConfig>;

/** Badge tint per technology category. The dot inherits it via `bg-current`. */
export const TECH_CATEGORY_CLASS = {
  FRONTEND: "bg-tech-frontend/10 text-tech-frontend",
  BACKEND: "bg-tech-backend/10 text-tech-backend",
  DATABASE: "bg-tech-database/10 text-tech-database",
  DEVOPS: "bg-tech-devops/10 text-tech-devops",
  AI: "bg-tech-ai/10 text-tech-ai",
  OTHER: "bg-tech-other/10 text-tech-other",
} as const satisfies Record<TechCategory, string>;

/** Cards per page in the entries grid. */
export const ENTRIES_PAGE_SIZE = 6;

/** Rows shown in the Recently Viewed list. */
export const RECENTLY_VIEWED_LIMIT = 5;
