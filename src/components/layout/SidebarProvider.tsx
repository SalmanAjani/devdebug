"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface SidebarState {
  /** Desktop: sidebar shrunk to icons only. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile: sidebar shown as a drawer. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }),
    [collapsed, toggleCollapsed, mobileOpen]
  );

  return <SidebarContext value={value}>{children}</SidebarContext>;
}

export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
