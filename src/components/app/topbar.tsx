import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, ChevronLeft, Search, ArrowLeftRight, Bell, Languages, Check } from "lucide-react";
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
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { PAGE_TITLES } from "@/lib/nav-config";

type TopbarProps = { onOpenPalette: () => void };

export function Topbar({ onOpenPalette }: TopbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { gender, setGender, module, setModule } = useSystem();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();

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
        <Link
          to="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline"
        >
          {lang === "ur" ? "ایم ایس ایم آئی ایس" : "MSMIS"}
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180 hidden sm:inline" />
        <div className="min-w-0">
          {lang === "ur" ? (
            <>
              <p className="font-urdu text-sm truncate leading-none">{current.ur}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                {current.en}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm truncate leading-none font-medium">{current.en}</p>
              <p
                className="text-[10px] text-muted-foreground truncate font-urdu"
                dir="rtl"
                lang="ur"
              >
                {current.ur}
              </p>
            </>
          )}
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
          <span>{lang === "ur" ? "تلاش کریں…" : "Search…"}</span>
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
                "hidden sm:inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-medium",
                "bg-primary/10 text-primary hover:bg-primary/15",
              )}
            >
              {gender === "male"
                ? lang === "ur"
                  ? "🕌 جاسمہ قاسمیہ"
                  : "🕌 Jamia Qasimia"
                : lang === "ur"
                  ? "🌙 زینب للبنات"
                  : "🌙 Jamyah Zainab"}
              <ArrowLeftRight className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">
              {lang === "ur" ? "فعال نظام" : "Active system"}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setGender("male")}>
              🕌 <span className="font-urdu ms-2">{lang === "ur" ? "جاسمہ قاسمیہ" : "Jamia Qasimia"}</span>
              <span className="ms-auto text-[10px] text-muted-foreground">{lang === "ur" ? "جاسمہ قاسمیہ" : "Jamia Qasimia"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGender("female")}>
              🌙 <span className="font-urdu ms-2">{lang === "ur" ? "زینب للبنات" : "Jamyah Zainab"}</span>
              <span className="ms-auto text-[10px] text-muted-foreground">{lang === "ur" ? "زینب للبنات" : "Jamyah Zainab"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Switcher */}
        <div className="hidden sm:inline-flex items-center bg-muted/60 dark:bg-muted/40 p-0.5 rounded-full border border-border/60 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 select-none",
              lang === "en"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Switch to English"
          >
            <Languages className="h-3 w-3 opacity-60" />
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => setLang("ur")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 select-none",
              lang === "ur"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="اردو میں تبدیل کریں"
          >
            <span className="font-urdu text-[13px] leading-none">اردو</span>
          </button>
        </div>

        {/* Mobile Language Switcher */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === "ur" ? "en" : "ur")}
          className="sm:hidden h-8 px-2 gap-1 text-xs font-medium rounded-full bg-muted/50 border border-border/50"
          aria-label="Switch language"
        >
          <Languages className="h-3.5 w-3.5 text-primary" />
          <span className={cn("text-xs font-bold", lang === "ur" && "font-urdu")}>
            {lang === "ur" ? "اردو" : "EN"}
          </span>
        </Button>

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
              <span>{lang === "ur" ? "اعلانات" : "Notifications"}</span>
              <Link
                to="/notifications"
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                {lang === "ur" ? "سب دیکھیں" : "View all"}
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { t: "5 fee payments due today", u: "آج 5 فیسیں واجب الادا", tone: "text-amber-600" },
              { t: "New admission application", u: "نئی داخلہ درخواست", tone: "text-blue-600" },
              { t: "Inventory low: Notebooks", u: "نوٹ بک کم", tone: "text-destructive" },
            ].map((n, i) => (
              <DropdownMenuItem key={i} className="flex-col items-start gap-0.5">
                <span className={cn("text-xs", n.tone)}>{lang === "ur" ? n.u : n.t}</span>
                <span className="font-urdu text-sm text-muted-foreground">{lang === "ur" ? n.u : n.t}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">
                  {user?.name ?? (lang === "ur" ? "لاگ ان صارف" : "Signed in user")}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/account">
                {lang === "ur" ? (
                  <>
                    <span className="font-urdu text-sm">اکاؤنٹ کی ترتیبات</span>
                    <span className="ms-auto text-xs text-muted-foreground">Account</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">Account Settings</span>
                    <span
                      className="ms-auto text-xs text-muted-foreground font-urdu"
                      dir="rtl"
                      lang="ur"
                    >
                      اکاؤنٹ ترتیبات
                    </span>
                  </>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/account" search={{ tab: "security" } as never}>
                {lang === "ur" ? "پاس ورڈ تبدیل کریں" : "Change password"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang(lang === "ur" ? "en" : "ur")}>
              <Languages className="h-4 w-4 me-2 opacity-70" />
              <span>{lang === "ur" ? "زبان تبدیل کریں" : "Switch language"}</span>
              <span className="ms-auto text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                {lang === "ur" ? "English" : "اردو"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void logout()}
            >
              {lang === "ur" ? (
                <>
                  <span className="font-urdu text-sm">سائن آؤٹ</span>
                  <span className="ms-auto text-xs">Sign out</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Sign out</span>
                  <span className="ms-auto text-xs font-urdu" dir="rtl" lang="ur">
                    سائن آؤٹ
                  </span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
