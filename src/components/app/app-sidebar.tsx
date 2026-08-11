import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, School, ChevronDown, ChevronRight } from "lucide-react";
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
import { useLanguage } from "@/components/language-context";
import { institution } from "@/mock";
import { cn } from "@/lib/utils";
import { visibleFor, type NavItem } from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { useState, useMemo } from "react";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type SectionKey = "madrassa" | "school" | "shared" | "admin";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { system, setSystem } = useSystem();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();
  const role = (user?.role ?? "parent") as UserRole;
  const isParent = role === "parent";

  const globalNav = visibleFor(role, "global");
  const madrassaNav = visibleFor(role, "madrassa");
  const schoolNav = visibleFor(role, "school");
  const sharedNav = visibleFor(role, "shared");
  const adminNav = visibleFor(role, "admin");
  const sidebarSide = lang === "en" ? "left" : "right";

  const [openSection, setOpenSection] = useState<SectionKey | null>("madrassa");

  const toggleSection = (section: SectionKey) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const allUrls = useMemo(
    () => [...globalNav, ...madrassaNav, ...schoolNav, ...sharedNav, ...adminNav].map((i) => i.url),
    [globalNav, madrassaNav, schoolNav, sharedNav, adminNav],
  );

  const isActive = (url: string) => {
    if (pathname === url) return true;
    const hasMoreSpecific = allUrls.some((u) => u !== url && u.startsWith(url + "/"));
    if (hasMoreSpecific) return false;
    return pathname.startsWith(url + "/");
  };

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.url} className="mb-1.5">
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={collapsed ? (lang === "ur" ? item.ur : item.en) : undefined}
        className={cn(
          "h-auto min-h-[3.75rem] gap-3 px-3 py-3 text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          "data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:top-2 data-[active=true]:before:bottom-2 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:rounded-full",
        )}
      >
        <Link to={item.url}>
          <item.icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
          {!collapsed && (
            <div className="flex flex-col leading-tight gap-1 min-w-0">
              {lang === "ur" ? (
                <span className="font-urdu text-[16px] leading-tight truncate" dir="rtl" lang="ur">
                  {item.ur}
                </span>
              ) : (
                <span className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60 truncate">
                  {item.en}
                </span>
              )}
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const sectionLabel = (en: string, ur: string) =>
    lang === "ur" ? (
      <span className="font-urdu text-sm leading-tight" dir="rtl" lang="ur">
        {ur}
      </span>
    ) : (
      <span className="text-sm leading-tight font-medium">{en}</span>
    );

  const renderAccordionSection = (key: SectionKey, labelEn: string, labelUr: string, items: NavItem[]) => {
    if (!collapsed && items.length === 0) return null;
    const isOpen = openSection === key;

    return (
      <SidebarGroup className="px-1.5 pt-2">
        {!collapsed && (
          <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-start transition hover:bg-sidebar-accent/60"
            >
              {sectionLabel(labelEn, labelUr)}
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
              )}
            </button>
          </SidebarGroupLabel>
        )}
        {isOpen && !collapsed && (
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{items.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" side={sidebarSide}>
      <SidebarHeader className="border-b border-sidebar-border py-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="h-10 w-10 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <School className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              {lang === "ur" ? (
                <p className="font-urdu text-base leading-tight" dir="rtl" lang="ur">
                  ایم ایس ایم آئی ایس
                </p>
              ) : (
                <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/55 truncate">
                  MSMIS · Management
                </p>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-1.5 pt-3">
          {!collapsed && (
            <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
              {sectionLabel("Global", "عمومی")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{globalNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isParent && !collapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="grid grid-cols-2 bg-sidebar-accent/40 rounded-lg p-1 gap-1">
              <button
                onClick={() => setSystem("madrassa")}
                className={cn(
                  "rounded-md py-2 text-sm font-medium transition-all duration-150",
                  system === "madrassa"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
              >
                {lang === "ur" ? "🕌 مدرسہ" : "🕌 Madrassa"}
              </button>
              <button
                onClick={() => setSystem("school")}
                className={cn(
                  "rounded-md py-2 text-sm font-medium transition-all duration-150",
                  system === "school"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
              >
                {lang === "ur" ? "🏫 اسکول" : "🏫 School"}
              </button>
            </div>
          </div>
        )}

        {!isParent && (system === "madrassa" ? madrassaNav : schoolNav).length > 0 && (
          renderAccordionSection(
            system === "madrassa" ? "madrassa" : "school",
            system === "madrassa" ? "Madrassa" : "School",
            system === "madrassa" ? "مدرسہ" : "اسکول",
            system === "madrassa" ? madrassaNav : schoolNav,
          )
        )}

        {renderAccordionSection("shared", "Shared", "مشترکہ", sharedNav)}
        {renderAccordionSection("admin", "Admin", "انتظامیہ", adminNav)}
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
                <p
                  className="font-urdu text-sm truncate text-sidebar-foreground"
                  dir="rtl"
                  lang="ur"
                >
                  {institution.nameUrdu}
                </p>
                <p className="text-[10px] text-sidebar-foreground/55 truncate">
                  {user?.name ?? "Signed in user"}
                </p>
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
