// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "localhost",
      port: 3000,
      strictPort: true,
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "lucide-react",
        "vaul",
        "cmdk",
        "sonner",
        "date-fns",
        "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-select",
        "@radix-ui/react-alert-dialog",
        "@radix-ui/react-tabs",
        "@radix-ui/react-popover",
        "@radix-ui/react-tooltip",
        "@radix-ui/react-accordion",
        "@radix-ui/react-checkbox",
        "@radix-ui/react-radio-group",
        "@radix-ui/react-avatar",
      ],
    },
  },
});

