import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, ChevronLeft, Search, ArrowLeftRight, Bell } from "lucide-react";
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
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { PAGE_TITLES } from "@/lib/nav-config";

type TopbarProps = { onOpenPalette: () => void };

export function Topbar({ onOpenPalette }: TopbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { system, setSystem } = useSystem();
  const { user, logout } = useSession();

  const current = PAGE_TITLES[pathname] ?? { en: "MSMIS", ur: "ایم ایس ایم آئی ایس" };
  const initials = (user?.name ?? "MSMIS")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPalette}
          className="hidden md:inline-flex items-center gap-2 text-xs text-muted-foreground h-8 px-2.5 min-w-[200px] justify-start"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ms-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-medium font-urdu",
                "bg-primary/10 text-primary hover:bg-primary/15",
              )}
            >
              {system === "madrassa" ? "🕌 مدرسہ" : "🏫 اسکول"}
              <ArrowLeftRight className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">Active system</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSystem("madrassa")}>
              🕌 <span className="font-urdu ms-2">مدرسہ</span>
              <span className="ms-auto text-[10px] text-muted-foreground">Madrassa</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSystem("school")}>
              🏫 <span className="font-urdu ms-2">اسکول</span>
              <span className="ms-auto text-[10px] text-muted-foreground">School</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications · اعلانات</span>
              <Link to="/notifications" className="text-[10px] text-muted-foreground hover:text-foreground">View all</Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { t: "5 fee payments due today", u: "آج 5 فیسیں واجب الادا", tone: "text-amber-600" },
              { t: "New admission application", u: "نئی داخلہ درخواست", tone: "text-blue-600" },
              { t: "Inventory low: Notebooks", u: "نوٹ بک کم", tone: "text-destructive" },
            ].map((n, i) => (
              <DropdownMenuItem key={i} className="flex-col items-start gap-0.5">
                <span className={cn("text-xs", n.tone)}>{n.t}</span>
                <span className="font-urdu text-sm text-muted-foreground">{n.u}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{user?.name ?? "Signed in user"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
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
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void logout()}
            >
                <span className="font-urdu text-sm">سائن آؤٹ</span>
                <span className="ms-auto text-xs">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
