import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, ChevronLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useSystem } from "@/components/system-context";
import { currentUser } from "@/mock";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, { en: string; ur: string }> = {
  "/dashboard": { en: "Dashboard", ur: "ڈیش بورڈ" },
  "/admission": { en: "Admission", ur: "داخلہ" },
  "/admission/new": { en: "New Admission", ur: "نیا داخلہ" },
  "/admission/queue": { en: "Application Queue", ur: "درخواستوں کی قطار" },
  "/madrassa/students": { en: "Madrassa Students", ur: "مدرسہ — طلبہ" },
  "/madrassa/attendance": { en: "Madrassa Attendance", ur: "مدرسہ — حاضری" },
  "/madrassa/fees": { en: "Madrassa Fees", ur: "مدرسہ — فیس" },
  "/madrassa/categories": { en: "Categories", ur: "اقسام" },
  "/school/students": { en: "School Students", ur: "اسکول — طلبہ" },
  "/school/attendance": { en: "School Attendance", ur: "اسکول — حاضری" },
  "/school/fees": { en: "School Fees", ur: "اسکول — فیس" },
  "/school/exams": { en: "Examinations", ur: "امتحانات" },
  "/teachers": { en: "Teachers", ur: "اساتذہ" },
  "/id-cards": { en: "ID Cards", ur: "شناختی کارڈ" },
  "/reports": { en: "Reports", ur: "رپورٹس" },
  "/inventory": { en: "Inventory", ur: "انوینٹری" },
  "/finance": { en: "Finance", ur: "مالیات" },
  "/parents": { en: "Parents Portal", ur: "والدین" },
  "/users": { en: "User Management", ur: "صارف انتظام" },
  "/settings": { en: "Settings", ur: "ترتیبات" },
};

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { system } = useSystem();

  const current = PAGE_TITLES[pathname] ?? { en: "MSMIS", ur: "ایم ایس ایم آئی ایس" };

  return (
    <header className="h-14 sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border flex items-center px-4 gap-3">
      <SidebarTrigger className="-me-1" />
      <div className="flex items-center gap-2 min-w-0">
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline">
          MSMIS
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180 hidden sm:inline" />
        <div className="min-w-0">
          <p className="font-urdu text-sm truncate leading-none">{current.ur}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{current.en}</p>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <span
          className={cn(
            "hidden sm:inline-flex items-center rounded-full px-3 py-1 text-xs font-medium font-urdu",
            "bg-primary/10 text-primary",
          )}
        >
          {system === "madrassa" ? "🕌 مدرسہ" : "🏫 اسکول"}
        </span>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{currentUser.initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <span className="font-urdu text-sm">پروفائل</span>
                <span className="ms-auto text-xs text-muted-foreground">Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/change-password">
                <span className="font-urdu text-sm">پاس ورڈ تبدیل کریں</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
              <Link to="/login">
                <span className="font-urdu text-sm">سائن آؤٹ</span>
                <span className="ms-auto text-xs">Sign out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}