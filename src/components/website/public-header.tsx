import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { School, LogIn, FileSignature, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";
import { institution } from "@/mock";

export function PublicHeader() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", labelEn: "Home", labelUr: "ہوم", isHash: false },
    { to: "/#campuses", labelEn: "Campuses", labelUr: "شعبہ جات", isHash: true },
    { to: "/#portals", labelEn: "Portals", labelUr: "پورٹلز", isHash: true },
    { to: "/website/gallery", labelEn: "Gallery", labelUr: "گیلری", isHash: false },
    { to: "/website/contact", labelEn: "Contact", labelUr: "رابطہ", isHash: false },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <School className="h-5 w-5" />
          </div>
          <div>
            <p className="font-urdu text-base sm:text-lg font-bold leading-tight text-foreground">
              {institution.nameUrdu}
            </p>
            <p className="text-[10px] sm:text-[11px] font-sans tracking-wide text-muted-foreground uppercase">
              {institution.nameEnglish}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive =
              !item.isHash &&
              (item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/"));

            return item.isHash ? (
              <a
                key={item.to}
                href={item.to}
                className="px-3 py-1.5 rounded-lg hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
              >
                {isUrdu ? item.labelUr : item.labelEn}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to as never}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {isUrdu ? item.labelUr : item.labelEn}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="gap-1.5 border-primary/30">
            <Link to="/apply">
              <FileSignature className="h-3.5 w-3.5" />
              <span>{isUrdu ? "آن لائن داخلہ" : "Apply Online"}</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link to="/login">
              <LogIn className="h-3.5 w-3.5" />
              <span>{isUrdu ? "پورٹل لاگ ان" : "Portal Login"}</span>
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Button asChild size="sm" className="h-8 px-2.5 text-xs gap-1">
            <Link to="/login">
              <LogIn className="h-3 w-3" />
              <span>{isUrdu ? "لاگ ان" : "Login"}</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/98 px-4 pt-3 pb-5 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid gap-1">
            {navLinks.map((item) => (
              item.isHash ? (
                <a
                  key={item.to}
                  href={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent text-foreground"
                >
                  {isUrdu ? item.labelUr : item.labelEn}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to as never}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname === item.to
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  {isUrdu ? item.labelUr : item.labelEn}
                </Link>
              )
            ))}
          </div>

          <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                <FileSignature className="h-3.5 w-3.5" />
                {isUrdu ? "آن لائن داخلہ" : "Apply Online"}
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full gap-1.5 text-xs">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <LogIn className="h-3.5 w-3.5" />
                {isUrdu ? "پورٹل لاگ ان" : "Portal Login"}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
