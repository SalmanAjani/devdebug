"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bug, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SIDEBAR_NAV_ITEMS,
  type NavItem,
  type SidebarCounts,
} from "@/lib/constants/navigation";
import { MOCK_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  /** Item counts rendered beside each nav link. */
  counts: SidebarCounts;
  /** Icons-only mode. Always false inside the mobile drawer. */
  collapsed: boolean;
  /** Hidden in the mobile drawer, which closes instead of collapsing. */
  showCollapseToggle?: boolean;
  onToggleCollapse?: () => void;
  /** Fired when a nav link is clicked, so the mobile drawer can close. */
  onNavigate?: () => void;
}

interface NavLinkProps {
  item: NavItem;
  count: number;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, count, active, collapsed, onNavigate }: NavLinkProps) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg border border-transparent px-2.5 text-sm text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        active &&
          "border-sidebar-border bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {count}
          </span>
        </>
      )}
    </Link>
  );

  if (!collapsed) return link;

  // Collapsed hides the badge, so the tooltip carries the count instead.
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">
        {item.label} · {count}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarContent({
  counts,
  collapsed,
  showCollapseToggle = true,
  onToggleCollapse,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-3",
          collapsed && "justify-center px-0"
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Bug className="size-4" />
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">DevDebug</span>
            <span className="truncate text-xs text-muted-foreground">
              Debugging journal
            </span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                count={counts[item.countKey]}
                collapsed={collapsed}
                active={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5 border-t border-sidebar-border p-3",
          collapsed && "flex-col gap-2"
        )}
      >
        <Avatar>
          {MOCK_USER.image && (
            <AvatarImage src={MOCK_USER.image} alt={MOCK_USER.name} />
          )}
          <AvatarFallback>{MOCK_USER.initials}</AvatarFallback>
        </Avatar>

        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium">
              {MOCK_USER.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {MOCK_USER.email}
            </span>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/settings"
                onClick={onNavigate}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "shrink-0 text-muted-foreground"
                )}
              >
                <Settings />
                <span className="sr-only">Settings</span>
              </Link>
            }
          />
          <TooltipContent side={collapsed ? "right" : "top"}>
            Settings
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Collapse toggle */}
      {showCollapseToggle && (
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full justify-start gap-3 px-2.5 text-muted-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
