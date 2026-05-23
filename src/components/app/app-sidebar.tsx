import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileSignature,
  Users2,
  CalendarCheck,
  Banknote,
  Layers,
  GraduationCap,
  ClipboardList,
  IdCard,
  BarChart3,
  Package,
  Wallet,
  HeartHandshake,
  Settings,
  ShieldUser,
  LogOut,
  School,
} from "lucide-react";
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

type NavItem = { url: string; icon: typeof LayoutDashboard; en: string; ur: string };

const globalNav: NavItem[] = [
  { url: "/dashboard", icon: LayoutDashboard, en: "Dashboard", ur: "ڈیش بورڈ" },
  { url: "/admission", icon: FileSignature, en: "Admission", ur: "داخلہ" },
];

const madrassaNav: NavItem[] = [
  { url: "/madrassa/students", icon: Users2, en: "Students", ur: "طلبہ" },
  { url: "/madrassa/attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری" },
  { url: "/madrassa/fees", icon: Banknote, en: "Fees", ur: "فیس" },
  { url: "/madrassa/categories", icon: Layers, en: "Categories", ur: "اقسام" },
];

const schoolNav: NavItem[] = [
  { url: "/school/students", icon: Users2, en: "Students", ur: "طلبہ" },
  { url: "/school/attendance", icon: CalendarCheck, en: "Attendance", ur: "حاضری" },
  { url: "/school/fees", icon: Banknote, en: "Fees", ur: "فیس" },
  { url: "/school/exams", icon: ClipboardList, en: "Examinations", ur: "امتحانات" },
];

const sharedNav: NavItem[] = [
  { url: "/teachers", icon: GraduationCap, en: "Teachers", ur: "اساتذہ" },
  { url: "/id-cards", icon: IdCard, en: "ID Cards", ur: "شناختی کارڈ" },
  { url: "/reports", icon: BarChart3, en: "Reports", ur: "رپورٹس" },
  { url: "/inventory", icon: Package, en: "Inventory", ur: "انوینٹری" },
  { url: "/finance", icon: Wallet, en: "Finance", ur: "مالیات" },
  { url: "/parents", icon: HeartHandshake, en: "Parents Portal", ur: "والدین" },
];

const adminNav: NavItem[] = [
  { url: "/users", icon: ShieldUser, en: "Users", ur: "صارفین" },
  { url: "/settings", icon: Settings, en: "Settings", ur: "ترتیبات" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { system, setSystem } = useSystem();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={collapsed ? item.en : undefined}
        className={cn(
          "h-11 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          "data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:start-0 data-[active=true]:before:w-[2px] data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:rounded-full",
        )}
      >
        <Link to={item.url}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-urdu text-sm">{item.ur}</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">{item.en}</span>
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

        <SidebarGroup>
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