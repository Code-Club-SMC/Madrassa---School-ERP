import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicHeader } from "@/components/website/public-header";
import { PublicFooter } from "@/components/website/public-footer";
import { DraggableLanguageToggle } from "@/components/app/draggable-language-toggle";

export const Route = createFileRoute("/website")({
  component: WebsiteShell,
});

function WebsiteShell() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <DraggableLanguageToggle />
    </div>
  );
}
