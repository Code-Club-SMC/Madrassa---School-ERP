import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Topbar } from "@/components/app/topbar";
import { CommandPalette } from "@/components/app/command-palette";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { DraggableLanguageToggle } from "@/components/app/draggable-language-toggle";
import { useSystem } from "@/components/system-context";
import { HRProvider } from "@/stores/hr-store";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { system, setSystem } = useSystem();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/madrassa")) setSystem("madrassa");
    if (pathname.startsWith("/school")) setSystem("school");
  }, [pathname, setSystem]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <HRProvider>
      <SidebarProvider
        style={
          { "--sidebar-width": "17.5rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties
        }
      >
        <div className="min-h-dvh flex w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1 min-w-0 relative">
            <Topbar onOpenPalette={() => setPaletteOpen(true)} />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 max-w-[1600px] w-full mx-auto">
              <Outlet />
            </main>
            <DraggableLanguageToggle />
          </SidebarInset>
          <MobileBottomNav />
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
      </SidebarProvider>
    </HRProvider>
  );
}
