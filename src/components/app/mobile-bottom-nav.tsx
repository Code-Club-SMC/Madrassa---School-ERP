import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users2, FileSignature, BarChart3, MoreHorizontal } from "lucide-react";
import { useSystem } from "@/components/system-context";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { module } = useSystem();
  const { lang } = useLanguage();

  const studentsUrl = module === "madrassa" ? "/madrassa/students" : "/school/students";

  const items = [
    { url: "/dashboard", icon: LayoutDashboard, en: "Home", ur: "ہوم" },
    { url: studentsUrl, icon: Users2, en: "Students", ur: "طلبہ" },
    { url: "/admission", icon: FileSignature, en: "Admission", ur: "داخلہ" },
    { url: "/reports", icon: BarChart3, en: "Reports", ur: "رپورٹس" },
    { url: "/settings", icon: MoreHorizontal, en: "More", ur: "مزید" },
  ];

  const isActive = (url: string) => {
    if (pathname === url) return true;
    if (url === "/dashboard") return false; // never match prefixes for dashboard
    // require exact match for short top-level URLs that are parents of other nav items
    if (url === "/reports" || url === "/settings") return false;
    return pathname.startsWith(url + "/");
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = isActive(i.url);
          return (
            <li key={i.url}>
              <Link
                to={i.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-0 py-2.5 text-[10px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <i.icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
                {lang === "ur" ? (
                  <span dir="rtl" lang="ur" className="font-urdu text-[13px] leading-tight mt-0.5">
                    {i.ur}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide leading-none mt-0.5">
                    {i.en}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
