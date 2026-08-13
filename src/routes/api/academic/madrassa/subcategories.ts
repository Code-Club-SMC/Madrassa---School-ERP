import { createFileRoute } from "@tanstack/react-router";
import { listMadrassaSubcategories } from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/subcategories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return json({ subcategories: await listMadrassaSubcategories(request) });
        } catch (error) {
          return errorResponse(error, "Could not load subcategories");
        }
      },
    },
  },
});
