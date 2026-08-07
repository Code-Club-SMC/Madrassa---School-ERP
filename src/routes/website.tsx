import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { School, Globe, Image as ImgIcon, Phone, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DraggableLanguageToggle } from "@/components/app/draggable-language-toggle";
import { useLanguage } from "@/components/language-context";
import { institution } from "@/mock";

export const Route = createFileRoute("/website")({
  component: WebsiteShell,
});

function WebsiteShell() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/website" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <School className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-urdu text-sm leading-none">{institution.nameUrdu}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {institution.nameEnglish}
              </p>
            </div>
          </Link>
          <nav className="ms-auto flex items-center gap-1 text-sm">
            <Link
              to="/website"
              className="px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "ur" ? "Home" : "ہوم"}
            </Link>
            <Link
              to="/website/gallery"
              className="px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1.5"
            >
              <ImgIcon className="h-3.5 w-3.5" />
              {lang === "ur" ? "Gallery" : "گیلری"}
            </Link>
            <Link
              to="/website/contact"
              className="px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5" />
              {lang === "ur" ? "Contact" : "رابطہ"}
            </Link>
            <Link to="/apply">
              <Button size="sm" className="ms-2 gap-1.5">
                <FileSignature className="h-3.5 w-3.5" />
                {lang === "ur" ? "Apply Online" : "آن لائن درخواست دیں"}
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} {institution.nameEnglish} —{" "}
            <span className="font-urdu">{institution.nameUrdu}</span>
          </p>
          <p>
            Powered by <span className="font-semibold">MSMIS</span>
          </p>
        </div>
      </footer>
      <DraggableLanguageToggle />
    </div>
  );
}
