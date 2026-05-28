import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, School } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSystem } from "@/components/system-context";
import { currentUser, institution } from "@/mock";
import { cn } from "@/lib/utils";
import { visibleFor, type NavItem } from "@/lib/nav-config";
import type { UserRole } from "@/types";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { system, setSystem } = useSystem();
  const role = currentUser.role as UserRole;

  const globalNav = visibleFor(role, "global");
  const madrassaNav = visibleFor(role, "madrassa");
  const schoolNav = visibleFor(role, "school");
  const sharedNav = visibleFor(role, "shared");
  const adminNav = visibleFor(role, "admin");

  const allUrls = [...globalNav, ...madrassaNav, ...schoolNav, ...sharedNav, ...adminNav].map((i) => i.url);
  const isActive = (url: string) => {
    if (pathname === url) return true;
    // If any other registered nav item also starts with this url, require an exact match for the parent.
    const hasMoreSpecific = allUrls.some((u) => u !== url && u.startsWith(url + "/"));
    if (hasMoreSpecific) return false;
    return pathname.startsWith(url + "/");
  };

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.url} className="mb-0.5">
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={collapsed ? item.en : undefined}
        className={cn(
          "h-14 gap-3 px-3 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          "data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:top-2 data-[active=true]:before:bottom-2 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:rounded-full",
        )}
      >
        <Link to={item.url}>
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-tight gap-0.5 min-w-0">
              <span className="font-urdu text-base truncate">{item.ur}</span>
              <span className="text-[11px] text-muted-foreground truncate">{item.en}</span>
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <School className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm tracking-tight">MSMIS</p>
              <p className="text-[10px] text-muted-foreground truncate">Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium">Global</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{globalNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="px-3 pt-2">
            <div className="grid grid-cols-2 bg-muted rounded-lg p-1 gap-1">
              <button
                onClick={() => setSystem("madrassa")}
                className={cn(
                  "rounded-md py-1.5 text-xs font-medium transition-all duration-150 font-urdu",
                  system === "madrassa" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                🕌 مدرسہ
              </button>
              <button
                onClick={() => setSystem("school")}
                className={cn(
                  "rounded-md py-1.5 text-xs font-medium transition-all duration-150 font-urdu",
                  system === "school" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                🏫 اسکول
              </button>
            </div>
          </div>
        )}

        <SidebarGroup key={system} className="animate-in fade-in-50 duration-300">
          {!collapsed && (
            <SidebarGroupLabel className="font-urdu text-sm">
              {system === "madrassa" ? "مدرسہ" : "اسکول"}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{(system === "madrassa" ? madrassaNav : schoolNav).map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium">Shared</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{sharedNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-2">
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium">Admin</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{adminNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{currentUser.initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{currentUser.name}</p>
                <p className="text-[10px] text-muted-foreground font-urdu truncate">{institution.nameUrdu}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                <Link to="/login">
                  <LogOut className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}