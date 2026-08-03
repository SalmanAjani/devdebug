import { Bug, FolderOpen, Pin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Item counts shown beside the nav links. */
export interface SidebarCounts {
  entries: number;
  collections: number;
  pinned: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Which count to show on the right of the link. */
  countKey: keyof SidebarCounts;
}

/** Primary sidebar navigation. Routes beyond /dashboard land in later phases. */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    label: "All Debug Entries",
    href: "/dashboard",
    icon: Bug,
    countKey: "entries",
  },
  {
    label: "Collections",
    href: "/collections",
    icon: FolderOpen,
    countKey: "collections",
  },
  { label: "Pinned", href: "/pinned", icon: Pin, countKey: "pinned" },
];
