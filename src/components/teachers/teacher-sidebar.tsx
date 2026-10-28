import { useMemo } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  GraduationCap,
  CalendarClock,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  User,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/components/language-context";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type TeacherTab =
  | "dashboard"
  | "classes"
  | "timetable"
  | "exams"
  | "attendance"
  | "madrassa_attendance"
  | "reports"
  | "profile";

const items: { value: TeacherTab; icon: typeof BookOpen; en: string; ur: string }[] = [
  { value: "dashboard", icon: BookOpen, en: "Dashboard", ur: "ڈیش بورڈ" },
  { value: "classes", icon: GraduationCap, en: "Classes", ur: "کلاسز" },
  { value: "timetable", icon: CalendarClock, en: "Timetable", ur: "ٹائم ٹیبل" },
  { value: "attendance", icon: CalendarCheck, en: "School Attendance", ur: "حاضری (اسکول)" },
  { value: "madrassa_attendance", icon: CalendarCheck, en: "Madrassa Attendance", ur: "حاضری (مدرسہ)" },
  { value: "exams", icon: ClipboardList, en: "Exams", ur: "امتحانات" },
  { value: "reports", icon: BarChart3, en: "Reports", ur: "رپورٹس" },
  { value: "profile", icon: User, en: "Profile", ur: "پروفائل" },
];

export type TeacherSidebarProps = {
  active?: TeacherTab;
  onChange?: (tab: TeacherTab) => void;
};

export function TeacherSidebar({ active, onChange }: TeacherSidebarProps) {
  const { lang } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as { tab?: TeacherTab };

  const currentActive = useMemo(() => {
    if (active) return active;
    if (pathname.startsWith("/school/attendance")) return "attendance";
    if (pathname.startsWith("/madrassa/attendance")) return "madrassa_attendance";
    if (pathname.startsWith("/school/exams") || pathname.startsWith("/madrassa/exams")) return "exams";
    if (pathname.startsWith("/reports")) return "reports";
    if (pathname.startsWith("/settings") || pathname.startsWith("/change-password")) return "profile";
    if (
      search?.tab &&
      [
        "dashboard",
        "classes",
        "timetable",
        "exams",
        "attendance",
        "madrassa_attendance",
        "reports",
        "profile",
      ].includes(search.tab)
    ) {
      return search.tab as TeacherTab;
    }
    return "dashboard";
  }, [active, pathname, search?.tab]);

  const handleSelect = (tabValue: TeacherTab) => {
    if (onChange) {
      onChange(tabValue);
      return;
    }

    switch (tabValue) {
      case "dashboard":
        navigate({ to: "/dashboard" });
        break;
      case "classes":
        navigate({ to: "/dashboard", search: { tab: "classes" } as any });
        break;
      case "timetable":
        navigate({ to: "/dashboard", search: { tab: "timetable" } as any });
        break;
      case "exams":
        navigate({ to: "/dashboard", search: { tab: "exams" } as any });
        break;
      case "attendance":
        navigate({ to: "/school/attendance" as any });
        break;
      case "madrassa_attendance":
        navigate({ to: "/madrassa/attendance" as any });
        break;
      case "reports":
        navigate({ to: "/dashboard", search: { tab: "reports" } as any });
        break;
      case "profile":
        navigate({ to: "/dashboard", search: { tab: "profile" } as any });
        break;
    }
  };

  const labels = useMemo(() => {
    const map = new Map<string, { label: string; tooltip: string }>();
    for (const item of items) {
      map.set(item.value, {
        label: lang === "ur" ? item.ur : item.en,
        tooltip: lang === "ur" ? item.ur : item.en,
      });
    }
    return map;
  }, [lang]);

  return (
    <Sidebar
      collapsible="none"
      side="left"
      className="w-64 lg:w-72 border-r border-sidebar-border bg-sidebar sticky top-[57px] h-[calc(100dvh-57px)] overflow-y-auto"
    >
      <SidebarHeader className="border-b border-sidebar-border py-3 px-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            {lang === "ur" ? (
              <p className="font-urdu text-base leading-tight" dir="rtl" lang="ur">
                استاد مینو
              </p>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground truncate">
                Teacher Menu
              </p>
            )}
            <p className="text-[10px] text-muted-foreground truncate">
              {lang === "ur" ? "تدریسی امور و حاضری" : "Teaching & Attendance"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2 pt-3">
          <SidebarGroupLabel className="flex flex-col items-start gap-0 h-auto py-1 mb-1 text-sidebar-foreground/70">
            <span className="text-xs font-medium uppercase tracking-wider">
              {lang === "ur" ? "مینو" : "Navigation"}
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive = currentActive === item.value;
                const text = labels.get(item.value)?.label ?? item.en;
                const tooltip = labels.get(item.value)?.tooltip ?? item.en;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => handleSelect(item.value)}
                      isActive={isActive}
                      tooltip={tooltip}
                      className={cn(
                        "h-auto min-h-[3rem] gap-3 px-3 py-2.5 text-sidebar-foreground transition-colors rounded-lg",
                        "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium",
                        "data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:top-2 data-[active=true]:before:bottom-2 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:rounded-full",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
                      <span
                        className={cn(
                          "truncate",
                          lang === "ur"
                            ? "font-urdu text-sm leading-normal text-sidebar-foreground"
                            : "text-xs font-medium tracking-wide text-sidebar-foreground/90",
                        )}
                      >
                        {text}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-3 px-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
              {initials(user?.name ?? "T")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {user?.name ?? "Teacher"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.email ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
            title={lang === "ur" ? "لاگ آؤٹ" : "Sign Out"}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
