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
import { institution } from "@/mock";
import { cn } from "@/lib/utils";
import { visibleFor, type NavItem } from "@/lib/nav-config";
import { useSession } from "@/hooks/use-session";
import type { UserRole } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { system, setSystem } = useSystem();
  const { user, logout } = useSession();
  const role = (user?.role ?? "parent") as UserRole;
  const isParent = role === "parent";

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
    <SidebarMenuItem key={item.url} className="mb-1.5">
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={collapsed ? item.en : undefined}
        className={cn(
          "h-auto min-h-[3.75rem] gap-3 px-3 py-3 text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          "data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:top-2 data-[active=true]:before:bottom-2 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:rounded-full",
        )}
      >
        <Link to={item.url}>
          <item.icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
          {!collapsed && (
            <div className="flex flex-col leading-tight gap-1 min-w-0">
              <span className="font-urdu text-[16px] leading-tight truncate" dir="rtl" lang="ur">{item.ur}</span>
              <span className="text-[10.5px] uppercase tracking-wide text-sidebar-foreground/60 truncate">{item.en}</span>
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border py-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="h-10 w-10 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <School className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-urdu text-base leading-tight" dir="rtl" lang="ur">ایم ایس ایم آئی ایس</p>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/55 truncate">MSMIS · Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-1.5 pt-3">
          {!collapsed && (
            <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
              <span className="font-urdu text-sm leading-tight" dir="rtl" lang="ur">عمومی</span>
              <span className="text-[10px] uppercase tracking-widest font-medium text-sidebar-foreground/45">Global</span>
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{globalNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && !isParent && (
          <div className="px-3 pt-3 pb-1">
            <div className="grid grid-cols-2 bg-sidebar-accent/40 rounded-lg p-1 gap-1">
              <button
                onClick={() => setSystem("madrassa")}
                className={cn(
                  "rounded-md py-2 text-sm font-medium transition-all duration-150 font-urdu",
                  system === "madrassa" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
              >
                🕌 مدرسہ
              </button>
              <button
                onClick={() => setSystem("school")}
                className={cn(
                  "rounded-md py-2 text-sm font-medium transition-all duration-150 font-urdu",
                  system === "school" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
              >
                🏫 اسکول
              </button>
            </div>
          </div>
        )}

        {!isParent && (system === "madrassa" ? madrassaNav : schoolNav).length > 0 && (
        <SidebarGroup key={system} className="px-1.5 pt-2 animate-in fade-in-50 duration-300">
          {!collapsed && (
            <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
              <span className="font-urdu text-sm leading-tight" dir="rtl" lang="ur">
                {system === "madrassa" ? "مدرسہ" : "اسکول"}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-medium text-sidebar-foreground/45">
                {system === "madrassa" ? "Madrassa" : "School"}
              </span>
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{(system === "madrassa" ? madrassaNav : schoolNav).map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {sharedNav.length > 0 && (
        <SidebarGroup className="px-1.5 pt-2">
          {!collapsed && (
            <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
              <span className="font-urdu text-sm leading-tight" dir="rtl" lang="ur">مشترکہ</span>
              <span className="text-[10px] uppercase tracking-widest font-medium text-sidebar-foreground/45">Shared</span>
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{sharedNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {adminNav.length > 0 && (
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-3 px-1.5">
          {!collapsed && (
            <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
              <span className="font-urdu text-sm leading-tight" dir="rtl" lang="ur">انتظامیہ</span>
              <span className="text-[10px] uppercase tracking-widest font-medium text-sidebar-foreground/45">Admin</span>
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{adminNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
              {initials(user?.name ?? "MSMIS")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-urdu text-sm truncate text-sidebar-foreground" dir="rtl" lang="ur">{institution.nameUrdu}</p>
                <p className="text-[10px] text-sidebar-foreground/55 truncate">{user?.name ?? "Signed in user"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => void logout()}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
