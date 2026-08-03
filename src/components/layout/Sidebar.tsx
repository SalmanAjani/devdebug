"use client";

import { SidebarContent } from "@/components/layout/SidebarContent";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { SidebarCounts } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** Fetched in the dashboard layout — this component runs on the client. */
  counts: SidebarCounts;
}

/** Collapsible sidebar on desktop, slide-in drawer on mobile. */
export function Sidebar({ counts }: SidebarProps) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          counts={counts}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="gap-0 p-0 data-[side=left]:w-64 md:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            counts={counts}
            collapsed={false}
            showCollapseToggle={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
