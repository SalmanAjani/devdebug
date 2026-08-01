import { Bug, FolderOpen, Pin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Primary sidebar navigation. Routes beyond /dashboard land in later phases. */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: "All Debug Entries", href: "/dashboard", icon: Bug },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Pinned", href: "/pinned", icon: Pin },
];
