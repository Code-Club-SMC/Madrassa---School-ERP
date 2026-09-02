import { useMemo } from "react";
import { BookOpen, GraduationCap, CalendarClock, ClipboardList, CalendarCheck, BarChart3, User } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
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

type TeacherTab = "dashboard" | "classes" | "timetable" | "exams" | "attendance" | "reports" | "profile";

const items: { value: TeacherTab; icon: typeof BookOpen; en: string; ur: string }[] = [
  { value: "dashboard", icon: BookOpen, en: "Dashboard", ur: "ڈیش بورڈ" },
  { value: "classes", icon: GraduationCap, en: "Classes", ur: "کلاسز" },
  { value: "timetable", icon: CalendarClock, en: "Timetable", ur: "ٹائم ٹیبل" },
  { value: "exams", icon: ClipboardList, en: "Exams", ur: "امتحانات" },
  { value: "attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری" },
  { value: "reports", icon: BarChart3, en: "Reports", ur: "رپورٹس" },
  { value: "profile", icon: User, en: "Profile", ur: "پروفائل" },
];

type Props = {
  active: TeacherTab;
  onChange: (tab: TeacherTab) => void;
};

export function TeacherSidebar({ active, onChange }: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { lang } = useLanguage();
  const { user, logout } = useAuth();

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
    <Sidebar collapsible="icon" side="left" className="h-full border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border py-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="h-10 w-10 rounded-xl bg-sidebar-primary/15 border border-sidebar-primary/30 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              {lang === "ur" ? (
                <p className="font-urdu text-base leading-tight" dir="rtl" lang="ur">
                  استاد پورٹل
                </p>
              ) : (
                <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/55 truncate">
                  Teacher Portal
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
              <span className="text-sm leading-tight font-medium">
                {lang === "ur" ? "مینو" : "Menu"}
              </span>
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive = active === item.value;
                const text = labels.get(item.value)?.label ?? item.en;
                const tooltip = labels.get(item.value)?.tooltip ?? item.en;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => onChange(item.value)}
                      isActive={isActive}
                      tooltip={collapsed ? tooltip : undefined}
                      className={cn(
                        "h-auto min-h-[3.25rem] gap-3 px-3 py-3 text-sidebar-foreground",
                        "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                        "data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:top-2 data-[active=true]:before:bottom-2 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:rounded-full",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
                      {!collapsed && (
                        <span className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60 truncate">
                          {text}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
              {initials(user?.name ?? "T")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[10px] text-sidebar-foreground/55 truncate">
                {user?.name ?? "Teacher"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/55 truncate">
                {user?.email ?? ""}
              </p>
            </div>
          )}
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
