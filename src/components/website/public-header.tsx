import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { School, LogIn, FileSignature, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";
import { cn } from "@/lib/utils";
import { institution } from "@/mock";

export function PublicHeader() {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeSection, setActiveSection] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: "home", to: "/", labelEn: "Home", labelUr: "ہوم" },
    { id: "campuses", to: "/#campuses", labelEn: "Campuses", labelUr: "شعبہ جات" },
    { id: "portals", to: "/#portals", labelEn: "Portals", labelUr: "پورٹلز" },
    { id: "gallery", to: "/website/gallery", labelEn: "Gallery", labelUr: "گیلری" },
    { id: "contact", to: "/website/contact", labelEn: "Contact", labelUr: "رابطہ" },
  ];

  // Track active section when on the homepage via scroll position and hash
  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const checkHashAndScroll = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "campuses" || hash === "portals") {
        setActiveSection(hash);
        return;
      }

      const scrollY = window.scrollY;
      const campusesEl = document.getElementById("campuses");
      const portalsEl = document.getElementById("portals");

      const campusesTop = campusesEl ? campusesEl.offsetTop - 140 : 99999;
      const portalsTop = portalsEl ? portalsEl.offsetTop - 140 : 99999;

      if (portalsEl && scrollY >= portalsTop) {
        setActiveSection("portals");
      } else if (campusesEl && scrollY >= campusesTop) {
        setActiveSection("campuses");
      } else {
        setActiveSection("home");
      }
    };

    checkHashAndScroll();
    window.addEventListener("scroll", checkHashAndScroll, { passive: true });
    window.addEventListener("hashchange", checkHashAndScroll);

    return () => {
      window.removeEventListener("scroll", checkHashAndScroll);
      window.removeEventListener("hashchange", checkHashAndScroll);
    };
  }, [pathname]);

  const isLinkActive = (id: string) => {
    if (pathname === "/") {
      return activeSection === id;
    }
    if (id === "gallery") {
      return pathname === "/website/gallery" || pathname.startsWith("/website/gallery/");
    }
    if (id === "contact") {
      return pathname === "/website/contact" || pathname.startsWith("/website/contact/");
    }
    return false;
  };

  const handleNavClick = (id: string, e: React.MouseEvent) => {
    setMobileMenuOpen(false);

    if (id === "home") {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.replaceState(null, "", "/");
        setActiveSection("home");
      }
    } else if (id === "campuses" || id === "portals") {
      if (pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.replaceState(null, "", `#${id}`);
          setActiveSection(id);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <Link
          to="/"
          onClick={(e) => handleNavClick("home", e)}
          className="flex items-center gap-3 shrink-0"
        >
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
            const active = isLinkActive(item.id);
            const activeClasses = active
              ? "bg-primary/10 text-primary font-semibold shadow-2xs"
              : "text-muted-foreground hover:bg-accent hover:text-foreground";

            if (item.id === "campuses" || item.id === "portals") {
              return (
                <a
                  key={item.id}
                  href={`/#${item.id}`}
                  onClick={(e) => handleNavClick(item.id, e)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${activeClasses}`}
                >
                  {isUrdu ? item.labelUr : item.labelEn}
                </a>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.to as never}
                onClick={(e) => handleNavClick(item.id, e)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${activeClasses}`}
              >
                {isUrdu ? item.labelUr : item.labelEn}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Button
            asChild
            size="sm"
            variant={pathname === "/apply" ? "default" : "outline"}
            className={cn("gap-1.5", pathname !== "/apply" && "border-primary/30")}
          >
            <Link to="/apply">
              <FileSignature className="h-3.5 w-3.5" />
              <span>{isUrdu ? "آن لائن داخلہ" : "Apply Online"}</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant={pathname === "/login" ? "secondary" : "default"}
            className="gap-1.5 shadow-sm"
          >
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
            {navLinks.map((item) => {
              const active = isLinkActive(item.id);
              const activeClasses = active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-accent";

              if (item.id === "campuses" || item.id === "portals") {
                return (
                  <a
                    key={item.id}
                    href={`/#${item.id}`}
                    onClick={(e) => handleNavClick(item.id, e)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeClasses}`}
                  >
                    {isUrdu ? item.labelUr : item.labelEn}
                  </a>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.to as never}
                  onClick={(e) => handleNavClick(item.id, e)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeClasses}`}
                >
                  {isUrdu ? item.labelUr : item.labelEn}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
            <Button
              asChild
              variant={pathname === "/apply" ? "default" : "outline"}
              size="sm"
              className="w-full gap-1.5 text-xs"
            >
              <Link to="/apply" onClick={() => setMobileMenuOpen(false)}>
                <FileSignature className="h-3.5 w-3.5" />
                {isUrdu ? "آن لائن داخلہ" : "Apply Online"}
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/login" ? "secondary" : "default"}
              size="sm"
              className="w-full gap-1.5 text-xs"
            >
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
