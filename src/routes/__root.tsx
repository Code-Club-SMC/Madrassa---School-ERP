import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { SystemProvider } from "@/components/system-context";
import { LanguageProvider } from "@/components/language-context";
import { Toaster } from "@/components/ui/sonner";
import { useLanguage } from "@/components/language-context";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";

type RootContext = {
  queryClient: QueryClient;
  initialLang?: "ur" | "en";
};

function parseLangFromCookie(cookie: string | null): "ur" | "en" {
  if (!cookie) return "ur";
  const match = cookie.match(/msmis-lang=(ur|en)/);
  return match?.[1] === "en" ? "en" : "ur";
}

function NotFoundComponent() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {lang === "ur" ? "صفحہ نہیں ملا" : "Page not found"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ur"
            ? "صفحہ جو آپ ڈھونڈ رہے ہیں موجود نہیں ہے یا منتقل کر دیا گیا ہے۔"
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4 me-2" />
            {lang === "ur" ? "گھر" : "Go home"}
          </Link>
          <Button variant="outline" onClick={() => setLang(lang === "ur" ? "en" : "ur")}>
            {lang === "ur" ? "English" : "اردو"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {lang === "ur" ? "صفحہ لوڈ نہیں ہوا" : "This page didn't load"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ur"
            ? "کچھ غلط ہو گیا۔ آپ تازہ کاری کر سکتے ہیں یا گھر واپس جا سکتے ہیں۔"
            : "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4 me-2" />
            {lang === "ur" ? "دوبارہ کوشش کریں" : "Try again"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Home className="h-4 w-4 me-2" />
            {lang === "ur" ? "گھر" : "Go home"}
          </a>
          <Button variant="outline" onClick={() => setLang(lang === "ur" ? "en" : "ur")}>
            {lang === "ur" ? "English" : "اردو"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RootContext>()({
  beforeLoad: async (ctx: any) => {
    let cookie = typeof ctx?.request?.headers?.get === 'function' ? ctx.request.headers.get("cookie") : null;
    if (!cookie && typeof document !== "undefined") {
      cookie = document.cookie || null;
    }
    const initialLang = parseLangFromCookie(cookie);

    return { initialLang };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MSMIS — Madrassa & School Management" },
      {
        name: "description",
        content: "Bilingual Urdu/English management system for madrassas and schools.",
      },
      { property: "og:title", content: "MSMIS — Madrassa & School Management" },
      {
        property: "og:description",
        content: "Bilingual Urdu/English management system for madrassas and schools.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "MSMIS — Madrassa & School Management" },
      {
        name: "twitter:description",
        content: "Bilingual Urdu/English management system for madrassas and schools.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/83cfbf6e-6d73-4001-807a-9431c6d97e0e/id-preview-b07e84b2--7cd5d0ec-41f7-4413-a839-4a68594e16a5.lovable.app-1779600878655.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/83cfbf6e-6d73-4001-807a-9431c6d97e0e/id-preview-b07e84b2--7cd5d0ec-41f7-4413-a839-4a68594e16a5.lovable.app-1779600878655.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { initialLang } = Route.useRouteContext();
  const dir = initialLang === "en" ? "ltr" : "rtl";
  const lang = initialLang === "en" ? "en" : "ur";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, initialLang } = Route.useRouteContext();

  return (
    <LanguageProvider initialLang={initialLang}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SystemProvider>
            <Outlet />
            <Toaster position="top-center" richColors />
          </SystemProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
