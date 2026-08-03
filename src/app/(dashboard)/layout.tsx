import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { Topbar } from "@/components/layout/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCollectionCount } from "@/lib/db/collections";
import { getEntryCount, getPinnedEntryCount } from "@/lib/db/entries";

// The sidebar counts read the database, so the shell can never be prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [entries, collections, pinned] = await Promise.all([
    getEntryCount(),
    getCollectionCount(),
    getPinnedEntryCount(),
  ]);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-svh overflow-hidden bg-background">
          <Sidebar counts={{ entries, collections, pinned }} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
