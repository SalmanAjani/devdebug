"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentUser } from "@/lib/db/user";
import { cn } from "@/lib/utils";

interface SidebarUserProps {
  /** Null when the shell somehow renders without a session. */
  user: CurrentUser | null;
  collapsed: boolean;
  /** Closes the mobile drawer when a menu link is followed. */
  onNavigate?: () => void;
}

/**
 * The sidebar footer: who is signed in, and the menu to leave.
 *
 * The whole block is the trigger rather than the avatar alone — a 32px target
 * is a poor one, and the name beside it is the obvious thing to click.
 */
export function SidebarUser({ user, collapsed, onNavigate }: SidebarUserProps) {
  if (!user) {
    return (
      <div className="flex shrink-0 items-center border-t border-sidebar-border p-3">
        <Link
          href="/sign-in"
          className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <User className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">Sign in</span>}
        </Link>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-sidebar-border p-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-transparent p-1.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-sidebar-accent",
            collapsed && "justify-center"
          )}
          aria-label={`Account menu for ${user.name}`}
        >
          <UserAvatar
            name={user.name}
            image={user.image}
            initials={user.initials}
          />

          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>

        {/* Above the trigger: this sits at the bottom of the viewport. */}
        <DropdownMenuContent side="top" align="start" className="min-w-56">
          <div className="flex items-center gap-2.5 p-1.5">
            <UserAvatar
              name={user.name}
              image={user.image}
              initials={user.initials}
              size="sm"
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </span>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            render={<Link href="/profile" onClick={onNavigate} />}
          >
            <User />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            render={<Link href="/settings" onClick={onNavigate} />}
          >
            <Settings />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/*
            A form rather than an onClick: sign-out is a mutation, and posting
            it keeps working if the menu's JavaScript has not hydrated yet.
          */}
          <form action={signOutAction}>
            {/* `nativeButton` tells Base UI the render target is already a
                real <button>, so it skips the role/aria it adds otherwise. */}
            <DropdownMenuItem
              variant="destructive"
              className="w-full"
              nativeButton
              render={<button type="submit" />}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
