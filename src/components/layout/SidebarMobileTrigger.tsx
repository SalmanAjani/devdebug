"use client";

import { PanelLeft } from "lucide-react";

import { useSidebar } from "@/components/layout/SidebarProvider";
import { Button } from "@/components/ui/button";

/** Opens the sidebar drawer. Mobile and tablet only. */
export function SidebarMobileTrigger() {
  const { setMobileOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="shrink-0 md:hidden"
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation"
    >
      <PanelLeft />
    </Button>
  );
}
