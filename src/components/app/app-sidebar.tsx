import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LogOut,
  School,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeft,
  Languages,
  X,
  Search,
  Moon,
  Sun,
  Bell,
  ArrowLeftRight,
  Check,
  Settings as SettingsIcon,
  KeyRound,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSystem } from "@/components/system-context";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "@/components/theme-provider";
import { institution } from "@/mock";
import { cn } from "@/lib/utils";
import {
  parentsFor,
  childrenFor,
  findParentForPath,
  type NavParent,
  type NavChild,
} from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { useState, useMemo, useEffect, useRef } from "react";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const NOTIFICATIONS = [
  { t: "5 fee payments due today", u: "آج 5 فیسیں واجب الادا", tone: "text-amber-600 dark:text-amber-400" },
  { t: "New admission application", u: "نئی داخلہ درخواست", tone: "text-blue-600 dark:text-blue-400" },
  { t: "Inventory low: Notebooks", u: "نوٹ بک کم", tone: "text-destructive" },
];

type AppSidebarProps = {
  onOpenPalette?: () => void;
};

export function AppSidebar({ onOpenPalette }: AppSidebarProps) {
  const { openMobile, setOpenMobile, state, setOpen } = useSidebar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const { gender, setGender, module, setModule } = useSystem();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();
  const role = (user?.role ?? "parent") as UserRole;
  const isUrdu = lang === "ur";

  const filteredParents = useMemo(() => parentsFor(role), [role]);

  // Determine current parent based on the current URL
  const currentParent = useMemo(() => {
    return findParentForPath(pathname, filteredParents, module, role);
  }, [pathname, filteredParents, module, role]);

  // Selected parent in the UI
  const [selectedParentKey, setSelectedParentKey] = useState<string>(
    currentParent?.key ?? "dashboard",
  );

  // Synchronize selected parent with route transitions
  useEffect(() => {
    if (currentParent) {
      setSelectedParentKey(currentParent.key);
    }
  }, [currentParent]);

  const activeParent = useMemo(() => {
    return (
      filteredParents.find((p) => p.key === selectedParentKey) ??
      currentParent ??
      filteredParents[0]
    );
  }, [filteredParents, selectedParentKey, currentParent]);

  const activeChildren = useMemo(() => {
    if (!activeParent) return [];
    return childrenFor(activeParent, module, role);
  }, [activeParent, module, role]);

  const hasChildren = activeChildren.length > 0;
  const isChildOpen = hasChildren;

  // Hover state for the thin rail: expands to original size on hover
  const [isRailHovered, setIsRailHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (isChildOpen) {
      setIsRailHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsRailHovered(false);
    }, 120);
  };

  // Check if a child URL is active
  const allChildUrls = useMemo(() => activeChildren.map((c) => c.url), [activeChildren]);
  const isChildActive = (url: string) => {
    if (pathname === url) return true;
    const hasMoreSpecific = allChildUrls.some(
      (u) => u !== url && u.startsWith(url + "/"),
    );
    if (hasMoreSpecific) return false;
    return pathname.startsWith(url + "/");
  };

  // Check if a parent is active
  const isParentActive = (parent: NavParent) => {
    if (parent.key === "dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    if (currentParent?.key === parent.key) return true;
    return selectedParentKey === parent.key;
  };

  // Handle parent navigation / selection
  const handleSelectParent = (parent: NavParent) => {
    setSelectedParentKey(parent.key);

    if (parent.key === "dashboard" || (!parent.children && !parent.moduleScoped)) {
      setOpen(false);
      if (parent.url) {
        navigate({ to: parent.url });
      }
      return;
    }

    setOpen(true);

    const children = childrenFor(parent, module, role);
    const isAlreadyOnChild = children.some(
      (c) => pathname === c.url || pathname.startsWith(c.url + "/"),
    );

    if (!isAlreadyOnChild && children.length > 0) {
      navigate({ to: children[0].url });
    }
  };

  // Handle module toggle in Academic section
  const handleModuleChange = (newModule: "madrassa" | "school") => {
    setModule(newModule);
    if (newModule === "school" && pathname.startsWith("/madrassa")) {
      const targetUrl = pathname.replace("/madrassa", "/school");
      navigate({ to: targetUrl }).catch(() => {
        navigate({ to: "/school/students" });
      });
    } else if (newModule === "madrassa" && pathname.startsWith("/school")) {
      const targetUrl = pathname.replace("/school", "/madrassa");
      navigate({ to: targetUrl }).catch(() => {
        navigate({ to: "/madrassa/students" });
      });
    }
  };

  // Mobile accordion state
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(
    currentParent?.key ?? "academic",
  );

  // Render parent rail item (Desktop)
  const renderRailItem = (parent: NavParent, isExpanded: boolean) => {
    const active = isParentActive(parent);
    const ParentIcon = parent.icon;

    const buttonContent = (
      <button
        type="button"
        onClick={() => handleSelectParent(parent)}
        className={cn(
          "relative flex items-center rounded-xl transition-all duration-150 select-none",
          isExpanded
            ? "w-full gap-3 px-3.5 py-2.5 text-start"
            : "h-11 w-12 justify-center mx-auto",
          active
            ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold ring-1 ring-sidebar-primary/25 shadow-xs"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
        )}
      >
        {active && (
          <span
            className={cn(
              "absolute bg-sidebar-primary rounded-full transition-all",
              isExpanded
                ? "inset-y-2 start-0 w-1"
                : "inset-y-2.5 start-0 w-[3px]",
            )}
          />
        )}
        <ParentIcon className="h-5 w-5 shrink-0" />
        {isExpanded && (
          <div className="flex flex-1 items-center justify-between min-w-0">
            {isUrdu ? (
              <span
                className="font-urdu text-[15px] leading-tight truncate"
                dir="rtl"
                lang="ur"
              >
                {parent.ur}
              </span>
            ) : (
              <span className="text-xs uppercase tracking-wider font-medium truncate">
                {parent.en}
              </span>
            )}
            {parent.key !== "dashboard" && (
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 opacity-40 transition-transform",
                  isUrdu && "rotate-180",
                )}
              />
            )}
          </div>
        )}
      </button>
    );

    if (!isExpanded) {
      return (
        <Tooltip key={parent.key} delayDuration={100}>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent
            side={isUrdu ? "left" : "right"}
            sideOffset={8}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium z-50 shadow-md"
          >
            {isUrdu ? (
              <span className="font-urdu text-sm" dir="rtl" lang="ur">
                {parent.ur}
              </span>
            ) : (
              <span>{parent.en}</span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={parent.key} className="w-full">{buttonContent}</div>;
  };

  // Determine width of desktop layout spacer
  const desktopSpacerWidth = isChildOpen
    ? "w-[17rem]" // thin strip (5rem / w-20) + child panel (12rem / w-48) = 17rem (272px)
    : "w-72"; // full parent rail (18rem / 288px)

  const isRailVisuallyExpanded = !isChildOpen || isRailHovered;

  return (
    <TooltipProvider delayDuration={0}>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE MINI-BAR (Only visible on small screens < md)           */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden sticky top-0 z-30 h-13 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex items-center gap-2.5"
        >
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center text-sidebar-primary">
            <School className="h-4 w-4" />
          </div>
          <span className="font-urdu text-base font-semibold leading-none">
            {institution.nameUrdu}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenPalette && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onOpenPalette}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs font-bold rounded-full bg-muted/60"
            onClick={() => setLang(lang === "ur" ? "en" : "ur")}
          >
            {lang === "ur" ? "EN" : "اردو"}
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR: Atlas Two-Pane Architecture                  */}
      {/* ------------------------------------------------------------- */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-[width] duration-200 ease-in-out select-none",
          desktopSpacerWidth,
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden md:flex h-svh bg-sidebar text-sidebar-foreground border-inline-end border-sidebar-border shadow-xs",
        )}
        style={{ direction: isUrdu ? "rtl" : "ltr" }}
      >
        {/* ============================================================ */}
        {/* PRIMARY PARENT RAIL                                          */}
        {/* ============================================================ */}
        <div
          className={cn(
            "relative h-full transition-[width] duration-200 ease-in-out shrink-0",
            isChildOpen ? "w-20" : "w-72",
          )}
        >
          <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "h-full flex flex-col bg-sidebar border-inline-end border-sidebar-border/60 transition-all duration-200 ease-in-out",
              isChildOpen
                ? isRailHovered
                  ? "absolute inset-y-0 start-0 w-72 z-50 shadow-2xl ring-1 ring-border/50"
                  : "w-20"
                : "w-72",
            )}
          >
            {/* Campus Small Toggle Button (Al-Qasimia / Al-Zainab) */}
            <div className="p-2.5 shrink-0 border-b border-sidebar-border/60">
              {isRailVisuallyExpanded ? (
                <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-sidebar-accent/25 border border-sidebar-border/40">
                  <div className="flex items-center gap-1.5 min-w-0 text-sidebar-foreground/70">
                    <span className="text-xs">{gender === "male" ? "🕌" : "🌙"}</span>
                    <span className="font-urdu text-[11px] truncate">
                      {isUrdu ? "کیمپس" : "Campus"}
                    </span>
                  </div>
                  {/* Small toggle button */}
                  <div className="flex items-center bg-sidebar-accent/70 p-0.5 rounded-lg border border-sidebar-border/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-urdu leading-none transition-all select-none",
                        gender === "male"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                      )}
                      title="Jamia Qasimia (Boys)"
                    >
                      {isUrdu ? "قاسمیہ" : "Qasimia"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-urdu leading-none transition-all select-none",
                        gender === "female"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                      )}
                      title="Jamia Zainab (Girls)"
                    >
                      {isUrdu ? "زینب" : "Zainab"}
                    </button>
                  </div>
                </div>
              ) : (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setGender(gender === "male" ? "female" : "male")}
                      className="group relative h-8 w-[52px] mx-auto flex items-center justify-between px-1.5 rounded-full bg-sidebar-accent/40 border border-sidebar-border/60 hover:bg-sidebar-accent/70 transition-all text-xs select-none"
                      aria-label="Toggle campus"
                    >
                      <span
                        className={cn(
                          "transition-all duration-150 z-10 text-xs text-center w-[22px]",
                          gender === "male" ? "opacity-100 scale-110" : "opacity-35 scale-90",
                        )}
                      >
                        🕌
                      </span>
                      <span
                        className={cn(
                          "transition-all duration-150 z-10 text-xs text-center w-[22px]",
                          gender === "female" ? "opacity-100 scale-110" : "opacity-35 scale-90",
                        )}
                      >
                        🌙
                      </span>
                      {/* Sliding toggle indicator */}
                      <span
                        className={cn(
                          "absolute top-0.5 bottom-0.5 w-[24px] rounded-full bg-sidebar-primary/25 border border-sidebar-primary/50 transition-all duration-200 ease-out",
                          gender === "male" ? "start-0.5" : "start-[26px]",
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={isUrdu ? "left" : "right"} className="text-xs">
                    {gender === "male" ? "جامعہ قاسمیہ (تبدیل کرنے کے لیے کلک کریں)" : "جامعہ زینب (تبدیل کرنے کے لیے کلک کریں)"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Parent Navigation Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2.5 space-y-1.5 scrollbar-thin">
              {filteredParents.map((parent) =>
                renderRailItem(parent, isRailVisuallyExpanded),
              )}
            </div>

            {/* Bottom Utilities (Language, Theme, Notifications, Profile) */}
            <div className="border-t border-sidebar-border/70 p-2.5 shrink-0 space-y-2 bg-sidebar">
              {/* Language Switcher Small Toggle */}
              {isRailVisuallyExpanded ? (
                <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-sidebar-accent/25 border border-sidebar-border/40">
                  <div className="flex items-center gap-1.5 min-w-0 text-sidebar-foreground/70">
                    <Languages className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-urdu text-[11px] truncate">
                      {isUrdu ? "زبان" : "Language"}
                    </span>
                  </div>
                  {/* Small toggle button */}
                  <div className="flex items-center bg-sidebar-accent/70 p-0.5 rounded-lg border border-sidebar-border/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLang("en")}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-semibold leading-none transition-all select-none",
                        lang === "en"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                      )}
                      title="English"
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang("ur")}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-urdu leading-none transition-all select-none",
                        lang === "ur"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                      )}
                      title="اردو"
                    >
                      اردو
                    </button>
                  </div>
                </div>
              ) : (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setLang(lang === "ur" ? "en" : "ur")}
                      className="group relative h-8 w-[52px] mx-auto flex items-center justify-between px-1.5 rounded-full bg-sidebar-accent/40 border border-sidebar-border/60 hover:bg-sidebar-accent/70 transition-all text-xs select-none"
                      aria-label="Toggle language"
                    >
                      <span
                        className={cn(
                          "transition-all duration-150 z-10 text-[10px] font-bold leading-none text-center w-[22px]",
                          lang === "en" ? "text-sidebar-foreground opacity-100" : "text-muted-foreground opacity-40",
                        )}
                      >
                        EN
                      </span>
                      <span
                        className={cn(
                          "transition-all duration-150 z-10 font-urdu font-bold text-[11px] leading-none text-center w-[22px]",
                          lang === "ur" ? "text-sidebar-foreground opacity-100" : "text-muted-foreground opacity-40",
                        )}
                      >
                        اردو
                      </span>
                      {/* Sliding toggle indicator */}
                      <span
                        className={cn(
                          "absolute top-0.5 bottom-0.5 w-[24px] rounded-full bg-sidebar-primary/25 border border-sidebar-primary/50 transition-all duration-200 ease-out",
                          lang === "en" ? "start-0.5" : "start-[26px]",
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={isUrdu ? "left" : "right"} className="text-xs">
                    {lang === "ur" ? "English (تبدیل کرنے کے لیے کلک کریں)" : "اردو (Click to switch)"}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Utility Row: Notifications + Theme */}
              <div
                className={cn(
                  "flex items-center gap-1",
                  isRailVisuallyExpanded ? "justify-between px-1" : "flex-col",
                )}
              >
                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "relative flex items-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors",
                        isRailVisuallyExpanded
                          ? "px-2.5 py-1.5 gap-2 text-xs"
                          : "h-10 w-12 justify-center mx-auto",
                      )}
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4 shrink-0" />
                      <span className="absolute top-1.5 end-2 w-2 h-2 rounded-full bg-destructive" />
                      {isRailVisuallyExpanded && (
                        <span className="truncate">
                          {isUrdu ? "اعلانات" : "Alerts"}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side={isRailVisuallyExpanded ? "top" : (isUrdu ? "left" : "right")}
                    align="start"
                    className="w-72 z-50"
                  >
                    <DropdownMenuLabel className="flex items-center justify-between text-xs">
                      <span>{isUrdu ? "اعلانات" : "Notifications"}</span>
                      <Link
                        to="/notifications"
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {isUrdu ? "سب دیکھیں" : "View all"}
                      </Link>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {NOTIFICATIONS.map((n, i) => (
                      <DropdownMenuItem key={i} className="flex-col items-start gap-0.5">
                        <span className={cn("text-xs", n.tone)}>
                          {isUrdu ? n.u : n.t}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme Toggle Button */}
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={cn(
                        "flex items-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground transition-colors",
                        isRailVisuallyExpanded
                          ? "px-2.5 py-1.5 gap-2 text-xs"
                          : "h-10 w-12 justify-center mx-auto",
                      )}
                      aria-label="Toggle theme"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                      ) : (
                        <Moon className="h-4 w-4 shrink-0" />
                      )}
                      {isRailVisuallyExpanded && (
                        <span className="truncate">
                          {theme === "dark"
                            ? isUrdu
                              ? "روشن موڈ"
                              : "Light"
                            : isUrdu
                              ? "تاریک موڈ"
                              : "Dark"}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={isUrdu ? "left" : "right"} className="text-xs">
                    {theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* User Profile & Account Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-sidebar-accent/60 text-start",
                      !isRailVisuallyExpanded && "justify-center",
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0 ring-1 ring-sidebar-border">
                      <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                        {initials(user?.name ?? "MSMIS")}
                      </AvatarFallback>
                    </Avatar>
                    {isRailVisuallyExpanded && (
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="text-xs font-medium truncate text-sidebar-foreground">
                          {user?.name ?? "Signed in"}
                        </p>
                        <p
                          className="font-urdu text-[11px] text-sidebar-foreground/55 truncate mt-0.5"
                          dir="rtl"
                          lang="ur"
                        >
                          {institution.nameUrdu}
                        </p>
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={isRailVisuallyExpanded ? "top" : (isUrdu ? "left" : "right")}
                  align="start"
                  className="w-56 z-50"
                >
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">
                        {user?.name ?? (isUrdu ? "لاگ ان صارف" : "Signed in user")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email ?? ""}
                      </p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sidebar-primary/10 text-sidebar-primary">
                        {role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="gap-2">
                      <SettingsIcon className="h-4 w-4 opacity-70" />
                      <span>{isUrdu ? "ترتیبات و پروفائل" : "Settings & Profile"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/change-password" className="gap-2">
                      <KeyRound className="h-4 w-4 opacity-70" />
                      <span>{isUrdu ? "پاس ورڈ تبدیل کریں" : "Change password"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    onClick={() => void logout()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isUrdu ? "لاگ آؤٹ" : "Sign out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>
        </div>

        {/* ============================================================ */}
        {/* SECONDARY CHILD SIDEBAR (Opens when parent has children)      */}
        {/* ============================================================ */}
        {isChildOpen && (
          <aside className="h-full w-48 flex flex-col bg-sidebar/95 backdrop-blur-md shrink-0 border-inline-end border-sidebar-border/60 transition-[width,opacity] duration-200 ease-in-out">
            {/* Module Switcher (Madrassa / School) for Academic */}
            {activeParent.key === "academic" && role !== "teacher" && (
              <div className="px-2 pt-2.5 pb-1 shrink-0">
                <div className="grid grid-cols-2 bg-sidebar-accent/50 rounded-lg p-0.5 gap-1 border border-sidebar-border/50">
                  <button
                    type="button"
                    onClick={() => handleModuleChange("madrassa")}
                    className={cn(
                      "rounded-md py-1 px-1 text-[11px] font-medium transition-all duration-150 flex items-center justify-center gap-1",
                      module === "madrassa"
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <span>🕌</span>
                    <span className="truncate">{isUrdu ? "مدرسہ" : "Madrassa"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModuleChange("school")}
                    className={cn(
                      "rounded-md py-1 px-1 text-[11px] font-medium transition-all duration-150 flex items-center justify-center gap-1",
                      module === "school"
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <span>🏫</span>
                    <span className="truncate">{isUrdu ? "اسکول" : "School"}</span>
                  </button>
                </div>

                <div className="mt-1 px-1 flex items-center justify-between text-[10px] text-sidebar-foreground/60">
                  <span className="font-urdu truncate" dir="rtl" lang="ur">
                    {gender === "male" ? "جامعہ قاسمیہ" : "جامعہ زینب"}
                  </span>
                  <span className="text-[9px] uppercase tracking-wide opacity-80 shrink-0">
                    {gender === "male" ? "Boys" : "Girls"}
                  </span>
                </div>
              </div>
            )}

            {/* Child Links List */}
            <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 scrollbar-thin">
              {activeChildren.map((child: NavChild) => {
                const active = isChildActive(child.url);
                const ChildIcon = child.icon;

                return (
                  <Link
                    key={child.url}
                    to={child.url}
                    title={isUrdu ? child.ur : child.en}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all duration-150 select-none",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1 start-0 w-[2.5px] rounded-full bg-sidebar-primary" />
                    )}
                    <ChildIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        active
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      {isUrdu ? (
                        <span
                          className="font-urdu text-[13.5px] leading-tight truncate"
                          dir="rtl"
                          lang="ur"
                        >
                          {child.ur}
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wide truncate">
                          {child.en}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE SHEET NAVIGATION                                        */}
      {/* ------------------------------------------------------------- */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={isUrdu ? "right" : "left"}
          className="w-[19rem] sm:w-[22rem] p-0 bg-sidebar text-sidebar-foreground flex flex-col"
          style={{ direction: isUrdu ? "rtl" : "ltr" }}
        >
          <SheetHeader className="p-4 border-b border-sidebar-border/70 flex flex-row items-center justify-between space-y-0 text-start">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
                <School className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-sidebar-foreground">
                  {isUrdu ? "ایم ایس ایم آئی ایس" : "MSMIS Management"}
                </SheetTitle>
                <SheetDescription className="text-xs text-sidebar-foreground/60">
                  {isUrdu ? institution.nameUrdu : institution.nameEnglish}
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60"
              onClick={() => setOpenMobile(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Mobile Switchers Bar (Campus + Language Small Toggles) */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-sidebar-border/60 bg-sidebar-accent/25 shrink-0">
            {/* Campus Small Toggle */}
            <div className="flex items-center bg-sidebar-accent/80 p-0.5 rounded-lg border border-sidebar-border/50 text-xs">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-urdu leading-none transition-all select-none",
                  gender === "male"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
                title="Jamia Qasimia (Boys)"
              >
                🕌 {isUrdu ? "قاسمیہ" : "Qasimia"}
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-urdu leading-none transition-all select-none",
                  gender === "female"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
                title="Jamia Zainab (Girls)"
              >
                🌙 {isUrdu ? "زینب" : "Zainab"}
              </button>
            </div>

            {/* Language Small Toggle */}
            <div className="flex items-center bg-sidebar-accent/80 p-0.5 rounded-lg border border-sidebar-border/50 text-xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold leading-none transition-all select-none",
                  lang === "en"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("ur")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-urdu leading-none transition-all select-none",
                  lang === "ur"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
                title="اردو"
              >
                اردو
              </button>
            </div>
          </div>

          {/* Mobile Accordion Nav */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Dashboard Direct Button */}
            <Link
              to="/dashboard"
              onClick={() => setOpenMobile(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-primary/20"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                <School className="h-4 w-4" />
              </div>
              <span className={cn("flex-1 text-start", isUrdu && "font-urdu text-base")}>
                {isUrdu ? "ڈیش بورڈ" : "Dashboard"}
              </span>
            </Link>

            {/* Other Parent Sections */}
            {filteredParents
              .filter((p) => p.key !== "dashboard")
              .map((parent) => {
                const isOpen = mobileExpandedSection === parent.key;
                const children = childrenFor(parent, module, role);
                const ParentIcon = parent.icon;

                return (
                  <div
                    key={parent.key}
                    className="rounded-xl border border-sidebar-border/60 overflow-hidden bg-sidebar-accent/15"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpandedSection(isOpen ? null : parent.key)
                      }
                      className="flex items-center justify-between w-full px-3 py-2.5 text-start hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <ParentIcon className="h-4 w-4 text-sidebar-primary" />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isUrdu && "font-urdu text-base",
                          )}
                        >
                          {isUrdu ? parent.ur : parent.en}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-2 pb-2 pt-1 border-t border-sidebar-border/40 space-y-1 bg-sidebar/50">
                        {/* Module switcher if academic */}
                        {parent.key === "academic" && role !== "teacher" && (
                          <div className="grid grid-cols-2 gap-1 p-1 bg-sidebar-accent/40 rounded-lg mb-2">
                            <button
                              type="button"
                              onClick={() => handleModuleChange("madrassa")}
                              className={cn(
                                "py-1 text-xs rounded font-medium",
                                module === "madrassa"
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/70",
                              )}
                            >
                              🕌 {isUrdu ? "مدرسہ" : "Madrassa"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModuleChange("school")}
                              className={cn(
                                "py-1 text-xs rounded font-medium",
                                module === "school"
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/70",
                              )}
                            >
                              🏫 {isUrdu ? "اسکول" : "School"}
                            </button>
                          </div>
                        )}

                        {children.map((child) => {
                          const active = pathname === child.url;
                          const ChildIcon = child.icon;

                          return (
                            <Link
                              key={child.url}
                              to={child.url}
                              onClick={() => setOpenMobile(false)}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                                active
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent",
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              <span
                                className={cn(
                                  "truncate",
                                  isUrdu && "font-urdu text-sm",
                                )}
                              >
                                {isUrdu ? child.ur : child.en}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Mobile Footer */}
          <div className="p-3 border-t border-sidebar-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                  {initials(user?.name ?? "MSMIS")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  {role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => {
                setOpenMobile(false);
                void logout();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isUrdu ? "لاگ آؤٹ" : "Logout"}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
