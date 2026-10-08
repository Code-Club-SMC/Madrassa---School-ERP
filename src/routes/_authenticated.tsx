"use client";

import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPalette } from "@/components/app/command-palette";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { useSystem } from "@/components/system-context";
import { useLanguage } from "@/components/language-context";
import { HRProvider } from "@/stores/hr-store";
import { useAuth } from "@/hooks/use-auth";
import { BookLoader } from "@/components/shared/book-loader";
import { TeacherPortal } from "@/components/teachers/teacher-portal";
import { ParentPortal } from "@/components/parents/parent-portal";
import { Button } from "@/components/ui/button";
import { School, LogOut, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { institution } from "@/mock";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const { module, setModule } = useSystem();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/madrassa")) setModule("madrassa");
    if (pathname.startsWith("/school")) setModule("school");
  }, [pathname, setModule]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login", search: { redirect: undefined } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <BookLoader text="Loading..." className="h-dvh" />;
  }

  if (!user) {
    return null;
  }

  const { lang, setLang } = useLanguage();
  const isUrdu = lang === "ur";
  const isTeacher = user?.role === "teacher";
  const isParent = user?.role === "parent";

  if (isTeacher) {
    return (
      <HRProvider>
        <SidebarProvider
          style={
            { "--sidebar-width": "17.5rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties
          }
        >
          <div className="min-h-dvh flex flex-col w-full bg-background">
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <School className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className={cn("text-sm leading-normal", isUrdu && "font-urdu")} dir={isUrdu ? "rtl" : "ltr"}>
                    {isUrdu ? institution.nameUrdu : institution.nameEnglish}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {isUrdu ? "استاد پورٹل" : "Teacher Portal"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-end hidden sm:block pe-1">
                  <p className="text-xs font-medium">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLang(isUrdu ? "en" : "ur")}
                  className="gap-1.5 text-xs h-8"
                  title={isUrdu ? "Switch to English" : "اردو میں دیکھیں"}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span>{isUrdu ? "English" : "اردو"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    navigate({ to: "/login" });
                  }}
                  className="gap-1.5 text-xs h-8"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isUrdu ? "لاگ آؤٹ" : "Sign Out"}</span>
                </Button>
              </div>
            </header>
            <SidebarInset className="flex-1 min-w-0">
              <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto">
                <TeacherPortal />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </HRProvider>
    );
  }

  if (isParent) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <School className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className={cn("text-sm leading-normal", isUrdu && "font-urdu")} dir={isUrdu ? "rtl" : "ltr"}>
                {isUrdu ? institution.nameUrdu : institution.nameEnglish}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {isUrdu ? "والدین پورٹل" : "Parent Portal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-end hidden sm:block pe-1">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(isUrdu ? "en" : "ur")}
              className="gap-1.5 text-xs h-8"
              title={isUrdu ? "Switch to English" : "اردو میں دیکھیں"}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{isUrdu ? "English" : "اردو"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                navigate({ to: "/login" });
              }}
              className="gap-1.5 text-xs h-8"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isUrdu ? "لاگ آؤٹ" : "Sign Out"}</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          <ParentPortal />
        </main>
      </div>
    );
  }

  return (
    <HRProvider>
      <SidebarProvider
        style={
          { "--sidebar-width": "17.5rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties
        }
      >
        <div className="min-h-dvh flex w-full bg-background">
          <AppSidebar onOpenPalette={() => setPaletteOpen(true)} />
          <SidebarInset className="flex-1 min-w-0 relative">
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 max-w-[1600px] w-full mx-auto">
              <Outlet />
            </main>
          </SidebarInset>
          <MobileBottomNav />
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
      </SidebarProvider>
    </HRProvider>
  );
}
