import { useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Topbar } from "@/components/app/topbar";
import { CommandPalette } from "@/components/app/command-palette";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { system } = useSystem();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarProvider style={{ "--sidebar-width": "17.5rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <Topbar onOpenPalette={() => setPaletteOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 max-w-[1600px] w-full mx-auto">
            <div key={`${system}:${pathname}`} className="animate-in fade-in-50 duration-200">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
        <MobileBottomNav />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </SidebarProvider>
  );
}